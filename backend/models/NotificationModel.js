import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Tiêu đề thông báo là bắt buộc"],
      trim: true,
      maxlength: [100, "Tiêu đề không được vượt quá 100 ký tự"],
    },
    message: {
      type: String,
      required: [true, "Nội dung thông báo là bắt buộc"],
      trim: true,
      maxlength: [1000, "Nội dung không được vượt quá 1000 ký tự"],
    },
    type: {
      type: String,
      enum: ["info", "warning", "success", "error", "announcement"],
      default: "info",
    },
    // Người gửi (admin)
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Người nhận (nếu null = gửi cho tất cả)
    recipients: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    // Kiểu gửi
    sendType: {
      type: String,
      enum: ["all", "specific", "role"], // all users, specific users, by role
      default: "all",
    },
    // Lọc theo role (nếu sendType = "role")
    targetRole: {
      type: String,
      enum: ["user", "admin"],
    },
    // Trạng thái
    isActive: {
      type: Boolean,
      default: true,
    },
    // Thời gian hết hạn (optional)
    expiresAt: {
      type: Date,
    },
    // Metadata cho frontend
    metadata: {
      icon: String, // emoji hoặc icon name
      color: String, // màu sắc
      actionUrl: String, // link để click vào
      actionText: String, // text cho button action
    },
    // Thống kê
    stats: {
      sent: { type: Number, default: 0 },
      delivered: { type: Number, default: 0 },
      read: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

// Model cho việc tracking đã đọc thông báo
const notificationReadSchema = new mongoose.Schema(
  {
    notification: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Notification",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    readAt: {
      type: Date,
      default: Date.now,
    },
    // Metadata khi đọc
    device: String, // web, mobile, etc.
    ip: String,
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ sendType: 1, isActive: 1 });
notificationSchema.index({ recipients: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Auto delete expired

notificationReadSchema.index({ notification: 1, user: 1 }, { unique: true });
notificationReadSchema.index({ user: 1, createdAt: -1 });

// Static methods
notificationSchema.statics.getActiveNotifications = async function (userId) {
  const now = new Date();

  return await this.find({
    isActive: true,
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: null },
      { expiresAt: { $gt: now } },
    ],
    $or: [
      { sendType: "all" },
      { recipients: userId },
      {
        sendType: "role",
        // Will need to join with User to check role
      },
    ],
  })
    .populate("sender", "username displayName")
    .sort({ createdAt: -1 });
};

notificationSchema.statics.markAsRead = async function (
  notificationId,
  userId,
  metadata = {}
) {
  const NotificationRead = mongoose.model("NotificationRead");

  try {
    await NotificationRead.findOneAndUpdate(
      { notification: notificationId, user: userId },
      {
        $set: {
          readAt: new Date(),
          ...metadata,
        },
      },
      { upsert: true, new: true }
    );

    // Update stats
    const readCount = await NotificationRead.countDocuments({
      notification: notificationId,
    });
    await this.findByIdAndUpdate(notificationId, {
      "stats.read": readCount,
    });

    return true;
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return false;
  }
};

// Middleware to update stats after save
notificationSchema.post("save", async function () {
  try {
    const User = mongoose.model("User");

    if (this.sendType === "all") {
      const userCount = await User.countDocuments();
      this.stats.sent = userCount;
    } else if (this.sendType === "specific") {
      this.stats.sent = this.recipients.length;
    } else if (this.sendType === "role" && this.targetRole) {
      const userCount = await User.countDocuments({ role: this.targetRole });
      this.stats.sent = userCount;
    }

    if (this.stats.sent > 0) {
      await this.constructor.findByIdAndUpdate(this._id, {
        "stats.sent": this.stats.sent,
      });
    }
  } catch (error) {
    console.error("Error updating notification stats:", error);
  }
});

const Notification = mongoose.model("Notification", notificationSchema);
const NotificationRead = mongoose.model(
  "NotificationRead",
  notificationReadSchema
);

export { Notification, NotificationRead };
export default Notification;
