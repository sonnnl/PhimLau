import asyncHandler from "express-async-handler";
import Notification from "../models/NotificationModel.js";
import User from "../models/UserModel.js";

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
export const getUserNotifications = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const filter = { recipient: req.user._id };

  // Filter by type if specified
  if (req.query.type) {
    filter.type = req.query.type;
  }

  // Filter by read status
  if (req.query.isRead !== undefined) {
    filter.isRead = req.query.isRead === "true";
  }

  const notifications = await Notification.find(filter)
    .populate("sender", "username displayName avatarUrl")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Notification.countDocuments(filter);
  const unreadCount = await Notification.countDocuments({
    recipient: req.user._id,
    isRead: false,
  });

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
    unreadCount,
  });
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
export const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({
    _id: req.params.id,
    recipient: req.user._id,
  });

  if (!notification) {
    res.status(404);
    throw new Error("Không tìm thấy thông báo");
  }

  await notification.markAsRead();

  res.json({
    success: true,
    message: "Đã đánh dấu thông báo là đã đọc",
    data: notification,
  });
});

// @desc    Mark notification as clicked
// @route   PUT /api/notifications/:id/click
// @access  Private
export const markAsClicked = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({
    _id: req.params.id,
    recipient: req.user._id,
  });

  if (!notification) {
    res.status(404);
    throw new Error("Không tìm thấy thông báo");
  }

  await notification.markAsClicked();

  res.json({
    success: true,
    message: "Đã đánh dấu thông báo là đã click",
    data: notification,
  });
});

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
export const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user._id, isRead: false },
    {
      isRead: true,
      readAt: new Date(),
    }
  );

  res.json({
    success: true,
    message: "Đã đánh dấu tất cả thông báo là đã đọc",
  });
});

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
export const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({
    _id: req.params.id,
    recipient: req.user._id,
  });

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

// @desc    Get notification stats
// @route   GET /api/notifications/stats
// @access  Private
export const getNotificationStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const stats = await Notification.aggregate([
    { $match: { recipient: userId } },
    {
      $group: {
        _id: "$type",
        count: { $sum: 1 },
        unreadCount: {
          $sum: { $cond: [{ $eq: ["$isRead", false] }, 1, 0] },
        },
      },
    },
  ]);

  const totalUnread = await Notification.countDocuments({
    recipient: userId,
    isRead: false,
  });

  res.json({
    success: true,
    data: {
      byType: stats,
      totalUnread,
    },
  });
});

// ==================== NOTIFICATION HELPERS ====================

// Helper function để tạo thông báo reply
export const createReplyNotification = async (reply, thread) => {
  try {
    // Không gửi thông báo cho chính mình
    if (reply.author._id.toString() === thread.author._id.toString()) {
      return;
    }

    await Notification.createNotification({
      recipient: thread.author._id,
      sender: reply.author._id,
      type: "thread_reply",
      title: "Có người trả lời chủ đề của bạn",
      message: `${
        reply.author.displayName || reply.author.username
      } đã trả lời chủ đề "${thread.title}"`,
      actionUrl: `/forum/thread/${thread.slug}#reply-${reply._id}`,
      relatedData: {
        threadId: thread._id,
        replyId: reply._id,
      },
    });
  } catch (error) {
    console.error("Error creating reply notification:", error);
  }
};

// Helper function để tạo thông báo like thread
export const createThreadLikeNotification = async (userId, thread) => {
  try {
    // Không gửi thông báo cho chính mình
    if (userId.toString() === thread.author._id.toString()) {
      return;
    }

    const user = await User.findById(userId);
    if (!user) return;

    await Notification.createNotification({
      recipient: thread.author._id,
      sender: userId,
      type: "thread_like",
      title: "Có người thích chủ đề của bạn",
      message: `${user.displayName || user.username} đã thích chủ đề "${
        thread.title
      }"`,
      actionUrl: `/forum/thread/${thread.slug}`,
      relatedData: {
        threadId: thread._id,
      },
    });
  } catch (error) {
    console.error("Error creating thread like notification:", error);
  }
};

// Helper function để tạo thông báo like reply
export const createReplyLikeNotification = async (userId, reply, thread) => {
  try {
    // Không gửi thông báo cho chính mình
    if (userId.toString() === reply.author._id.toString()) {
      return;
    }

    const user = await User.findById(userId);
    if (!user) return;

    await Notification.createNotification({
      recipient: reply.author._id,
      sender: userId,
      type: "reply_like",
      title: "Có người thích phản hồi của bạn",
      message: `${
        user.displayName || user.username
      } đã thích phản hồi của bạn trong chủ đề "${thread.title}"`,
      actionUrl: `/forum/thread/${thread.slug}#reply-${reply._id}`,
      relatedData: {
        threadId: thread._id,
        replyId: reply._id,
      },
    });
  } catch (error) {
    console.error("Error creating reply like notification:", error);
  }
};
