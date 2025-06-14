import asyncHandler from "express-async-handler";
import Notification, {
  NotificationRead,
} from "../../models/NotificationModel.js";
import User from "../../models/UserModel.js";

// @desc    Send notification to users (Admin only)
// @route   POST /api/admin/notifications/send
// @access  Private/Admin
const sendNotification = asyncHandler(async (req, res) => {
  try {
    const {
      title,
      message,
      type = "info",
      sendType = "all",
      recipients = [],
      targetRole,
      expiresAt,
      metadata = {},
    } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: "Tiêu đề và nội dung thông báo là bắt buộc",
      });
    }

    // Validate sendType
    if (!["all", "specific", "role"].includes(sendType)) {
      return res.status(400).json({
        success: false,
        message: "sendType không hợp lệ",
      });
    }

    // Create notification
    const notification = await Notification.create({
      title,
      message,
      type,
      sender: req.user._id,
      sendType,
      recipients: sendType === "specific" ? recipients : [],
      targetRole: sendType === "role" ? targetRole : undefined,
      expiresAt,
      metadata: {
        icon: metadata.icon || "🔔",
        color: metadata.color || "blue",
        actionUrl: metadata.actionUrl,
        actionText: metadata.actionText,
      },
    });

    // Get Socket.IO instance and emit to users
    const io = req.app.get("io");

    if (io) {
      let targetUsers = [];

      if (sendType === "all") {
        // Emit to all connected users
        io.emit("notification", {
          id: notification._id,
          title,
          message,
          type,
          metadata: notification.metadata,
          createdAt: notification.createdAt,
        });

        const allUsers = await User.find({}, "_id");
        targetUsers = allUsers.map((user) => user._id);
      } else if (sendType === "specific") {
        // Emit to specific users
        recipients.forEach((userId) => {
          io.to(`user_${userId}`).emit("notification", {
            id: notification._id,
            title,
            message,
            type,
            metadata: notification.metadata,
            createdAt: notification.createdAt,
          });
        });
        targetUsers = recipients;
      } else if (sendType === "role") {
        // Emit to users by role
        const roleUsers = await User.find({ role: targetRole }, "_id");
        roleUsers.forEach((user) => {
          io.to(`user_${user._id}`).emit("notification", {
            id: notification._id,
            title,
            message,
            type,
            metadata: notification.metadata,
            createdAt: notification.createdAt,
          });
        });
        targetUsers = roleUsers.map((user) => user._id);
      }
    }

    res.status(201).json({
      success: true,
      message: `🎉 Đã gửi thông báo thành công!`,
      data: notification,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi server khi gửi thông báo",
      error: error.message,
    });
  }
});

// @desc    Get notification statistics (Admin)
// @route   GET /api/admin/notifications/stats
// @access  Private/Admin
const getNotificationStats = asyncHandler(async (req, res) => {
  try {
    const totalNotifications = await Notification.countDocuments();
    const activeNotifications = await Notification.countDocuments({
      isActive: true,
    });

    const recentNotifications = await Notification.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    });

    // Top performing notifications
    const topNotifications = await Notification.find()
      .sort({ "stats.read": -1 })
      .limit(5)
      .select("title stats createdAt");

    res.json({
      success: true,
      data: {
        total: totalNotifications,
        active: activeNotifications,
        recent: recentNotifications,
        topPerforming: topNotifications,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy thống kê thông báo",
      error: error.message,
    });
  }
});

// @desc    Get all notifications for admin
// @route   GET /api/admin/notifications
// @access  Private/Admin
const getAllNotifications = asyncHandler(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const notifications = await Notification.find()
      .populate("sender", "username displayName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Notification.countDocuments();

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách thông báo",
      error: error.message,
    });
  }
});

export { sendNotification, getNotificationStats, getAllNotifications };
