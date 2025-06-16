import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    // Người nhận thông báo
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Người gửi/tạo ra thông báo (có thể null cho system notifications)
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Loại thông báo
    type: {
      type: String,
      enum: [
        "thread_reply", // Có người reply thread của bạn
        "thread_like", // Có người like thread của bạn
        "reply_like", // Có người like reply của bạn
        "mention", // Có người mention bạn
        "follow", // Có người follow bạn
        "system", // Thông báo hệ thống
        "admin_message", // Tin nhắn từ admin
        "moderation", // Thông báo kiểm duyệt
        "moderation_warning", // Cảnh báo vi phạm
        "account_suspended", // Tài khoản bị tạm khóa
        "account_banned", // Tài khoản bị cấm
        "content_removed", // Nội dung bị xóa
        "content_edited", // Nội dung cần chỉnh sửa
      ],
      required: true,
      index: true,
    },

    // Tiêu đề thông báo
    title: {
      type: String,
      required: true,
      maxlength: 200,
    },

    // Nội dung thông báo
    message: {
      type: String,
      required: true,
      maxlength: 500,
    },

    // Link để chuyển hướng khi click thông báo (thêm vào)
    link: {
      type: String,
      default: null,
    },

    // Link để chuyển hướng khi click thông báo
    actionUrl: {
      type: String,
      default: null,
    },

    // Metadata liên quan (thread, reply, etc.)
    relatedData: {
      threadId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ForumThread",
        default: null,
      },
      replyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ForumReply",
        default: null,
      },
      categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ForumCategory",
        default: null,
      },
    },

    // Trạng thái đã đọc
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },

    // Đã click vào thông báo chưa
    isClicked: {
      type: Boolean,
      default: false,
    },

    // Thời gian đọc
    readAt: {
      type: Date,
      default: null,
    },

    // Thời gian click
    clickedAt: {
      type: Date,
      default: null,
    },

    // Ưu tiên thông báo
    priority: {
      type: String,
      enum: ["low", "normal", "high", "urgent"],
      default: "normal",
    },

    // Thời gian hết hạn (cho thông báo tạm thời)
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ recipient: 1, type: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Static method để tạo thông báo
notificationSchema.statics.createNotification = async function ({
  recipient,
  sender = null,
  type,
  title,
  message,
  actionUrl = null,
  relatedData = {},
  priority = "normal",
  expiresAt = null,
}) {
  // Kiểm tra không tự gửi thông báo cho chính mình
  if (sender && recipient.toString() === sender.toString()) {
    return null;
  }

  return await this.create({
    recipient,
    sender,
    type,
    title,
    message,
    actionUrl,
    relatedData,
    priority,
    expiresAt,
  });
};

// Method đánh dấu đã đọc
notificationSchema.methods.markAsRead = async function () {
  if (!this.isRead) {
    this.isRead = true;
    this.readAt = new Date();
    await this.save();
  }
  return this;
};

// Method đánh dấu đã click
notificationSchema.methods.markAsClicked = async function () {
  if (!this.isClicked) {
    this.isClicked = true;
    this.clickedAt = new Date();
    await this.save();
  }
  return this;
};

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
