import asyncHandler from "express-async-handler";
import Notification from "../../models/NotificationModel.js";
import User from "../../models/UserModel.js";

// @desc    Get all notifications for admin
// @route   GET /api/admin/notifications
// @access  Private/Admin
export const getAllNotifications = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  // Build filter
  let filter = {};

  if (req.query.type) {
    filter.type = req.query.type;
  }

  if (req.query.recipient) {
    filter.recipient = req.query.recipient;
  }

  if (req.query.isRead !== undefined) {
    filter.isRead = req.query.isRead === "true";
  }

  const notifications = await Notification.find(filter)
    .populate("recipient", "username email displayName")
    .populate("sender", "username displayName")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Notification.countDocuments(filter);

  res.json({
    success: true,
    data: notifications,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total,
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    },
  });
});

// @desc    Send notification to specific users
// @route   POST /api/admin/notifications/send
// @access  Private/Admin
export const sendNotification = asyncHandler(async (req, res) => {
  const {
    recipients, // Array of user IDs or "all"
    type = "admin_message",
    title,
    message,
    actionUrl,
    priority = "normal",
    expiresAt,
  } = req.body;

  if (!title || !message) {
    res.status(400);
    throw new Error("Tiêu đề và nội dung là bắt buộc");
  }

  let targetUsers = [];

  if (recipients === "all") {
    // Gửi cho tất cả users
    targetUsers = await User.find({ role: "user" }).select("_id");
  } else if (Array.isArray(recipients)) {
    // Gửi cho users cụ thể
    targetUsers = await User.find({ _id: { $in: recipients } }).select("_id");
  } else {
    res.status(400);
    throw new Error("recipients phải là 'all' hoặc array user IDs");
  }

  if (targetUsers.length === 0) {
    res.status(400);
    throw new Error("Không tìm thấy người nhận nào");
  }

  // Tạo notifications cho tất cả users
  const notifications = [];
  for (const user of targetUsers) {
    const notification = await Notification.createNotification({
      recipient: user._id,
      sender: req.user._id,
      type,
      title,
      message,
      actionUrl,
      priority,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    });
    notifications.push(notification);
  }

  res.json({
    success: true,
    message: `Đã gửi thông báo cho ${targetUsers.length} người dùng`,
    data: {
      sentCount: targetUsers.length,
      notifications: notifications.slice(0, 5), // Chỉ trả về 5 notifications đầu
    },
  });
});

// @desc    Send notification to users by role
// @route   POST /api/admin/notifications/send-by-role
// @access  Private/Admin
export const sendNotificationByRole = asyncHandler(async (req, res) => {
  const {
    role = "user", // "user" or "admin"
    type = "admin_message",
    title,
    message,
    actionUrl,
    priority = "normal",
    expiresAt,
  } = req.body;

  if (!title || !message) {
    res.status(400);
    throw new Error("Tiêu đề và nội dung là bắt buộc");
  }

  const targetUsers = await User.find({ role }).select("_id");

  if (targetUsers.length === 0) {
    res.status(400);
    throw new Error(`Không tìm thấy user nào với role ${role}`);
  }

  // Tạo notifications
  const notifications = [];
  for (const user of targetUsers) {
    const notification = await Notification.createNotification({
      recipient: user._id,
      sender: req.user._id,
      type,
      title,
      message,
      actionUrl,
      priority,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    });
    notifications.push(notification);
  }

  res.json({
    success: true,
    message: `Đã gửi thông báo cho ${targetUsers.length} ${role}s`,
    data: {
      sentCount: targetUsers.length,
      role,
    },
  });
});

// @desc    Get notification statistics for admin
// @route   GET /api/admin/notifications/stats
// @access  Private/Admin
export const getNotificationStats = asyncHandler(async (req, res) => {
  const stats = await Notification.aggregate([
    {
      $group: {
        _id: "$type",
        total: { $sum: 1 },
        unread: {
          $sum: { $cond: [{ $eq: ["$isRead", false] }, 1, 0] },
        },
        read: {
          $sum: { $cond: [{ $eq: ["$isRead", true] }, 1, 0] },
        },
      },
    },
  ]);

  const totalNotifications = await Notification.countDocuments();
  const totalUnread = await Notification.countDocuments({ isRead: false });
  const totalUsers = await User.countDocuments({ role: "user" });

  // Recent activity (last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentActivity = await Notification.aggregate([
    {
      $match: {
        createdAt: { $gte: sevenDaysAgo },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Tính tổng notifications trong 7 ngày qua
  const recentCount = await Notification.countDocuments({
    createdAt: { $gte: sevenDaysAgo },
  });

  res.json({
    success: true,
    data: {
      byType: stats,
      overview: {
        totalNotifications,
        totalUnread,
        totalUsers,
        readRate:
          totalNotifications > 0
            ? (
                ((totalNotifications - totalUnread) / totalNotifications) *
                100
              ).toFixed(1)
            : 0,
      },
      recentActivity,
      recent: recentCount, // Thêm field này để tương thích với frontend
    },
  });
});

// @desc    Delete notification (admin)
// @route   DELETE /api/admin/notifications/:id
// @access  Private/Admin
export const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    res.status(404);
    throw new Error("Không tìm thấy thông báo");
  }

  await Notification.deleteOne({ _id: notification._id });

  res.json({
    success: true,
    message: "Đã xóa thông báo",
  });
});

// @desc    Bulk delete notifications
// @route   DELETE /api/admin/notifications/bulk
// @access  Private/Admin
export const bulkDeleteNotifications = asyncHandler(async (req, res) => {
  const { notificationIds } = req.body;

  if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
    res.status(400);
    throw new Error("notificationIds phải là array không rỗng");
  }

  const result = await Notification.deleteMany({
    _id: { $in: notificationIds },
  });

  res.json({
    success: true,
    message: `Đã xóa ${result.deletedCount} thông báo`,
    deletedCount: result.deletedCount,
  });
});

// @desc    Get users for notification targeting
// @route   GET /api/admin/notifications/users
// @access  Private/Admin
export const getUsersForNotification = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const skip = (page - 1) * limit;
  const search = req.query.search || "";

  let filter = { role: "user" };

  if (search) {
    filter.$or = [
      { username: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { displayName: { $regex: search, $options: "i" } },
    ];
  }

  const users = await User.find(filter)
    .select("_id username email displayName avatarUrl createdAt")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await User.countDocuments(filter);

  res.json({
    success: true,
    data: users,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total,
    },
  });
});
