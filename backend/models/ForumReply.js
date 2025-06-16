import mongoose from "mongoose";

const ForumReplySchema = new mongoose.Schema(
  {
    thread: {
      type: mongoose.Schema.ObjectId,
      ref: "ForumThread",
      required: true,
      index: true, // Index để tăng tốc độ lấy replies cho một thread
    },
    content: {
      type: String,
      required: [true, "Vui lòng nhập nội dung trả lời"],
      minlength: [5, "Nội dung phải có ít nhất 5 ký tự"],
    },
    author: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    // Thêm các trường cho admin quản lý
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
    deletedBy: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
    deleteReason: {
      type: String,
      maxlength: [200, "Lý do xóa không được vượt quá 200 ký tự"],
    },
    // Trạng thái kiểm duyệt
    moderationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "approved",
    },
    moderatedBy: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
    moderationNote: {
      type: String,
      maxlength: [300, "Ghi chú kiểm duyệt không được vượt quá 300 ký tự"],
    },
    moderatedAt: {
      type: Date,
    },
    // Thống kê
    likeCount: {
      type: Number,
      default: 0,
    },
    reportCount: {
      type: Number,
      default: 0,
    },
    // Reply lồng (nếu cần)
    parentReply: {
      type: mongoose.Schema.ObjectId,
      ref: "ForumReply",
      default: null,
    },
    // Đã chỉnh sửa
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
    },
    originalContent: {
      type: String,
      select: false, // Không hiển thị mặc định
    },
    // Thêm trường để track auto-approval
    autoApproved: {
      type: Boolean,
      default: false,
    },
    // Lý do auto-approve (nếu có)
    autoApprovalReason: {
      type: String,
      enum: ["trusted_user", "admin", "moderator", "content_safe"],
    },
    // Đánh dấu cần chỉnh sửa do moderation
    requiresEditing: {
      type: Boolean,
      default: false,
    },
    editingNote: {
      type: String,
      maxlength: [300, "Ghi chú chỉnh sửa không được vượt quá 300 ký tự"],
    },
  },
  { timestamps: true }
);

// Index để tăng hiệu suất
ForumReplySchema.index({ thread: 1, createdAt: 1 });
ForumReplySchema.index({ author: 1, createdAt: -1 });
ForumReplySchema.index({ isDeleted: 1, moderationStatus: 1 });
ForumReplySchema.index({ parentReply: 1 });

// Method kiểm tra quyền
ForumReplySchema.methods.canBeModeratedBy = function (user) {
  return (
    user.role === "admin" || this.author.toString() === user._id.toString()
  );
};

// Method soft delete
ForumReplySchema.methods.softDelete = async function (deletedBy, reason) {
  const oldStatus = this.isDeleted ? "deleted" : this.moderationStatus;

  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = deletedBy;
  if (reason) this.deleteReason = reason;

  const result = await this.save();

  // Cập nhật thread count
  await this.updateThreadCount(oldStatus, "deleted");

  return result;
};

// Middleware để lưu nội dung gốc khi chỉnh sửa
ForumReplySchema.pre("save", function (next) {
  if (this.isModified("content") && !this.isNew) {
    this.isEdited = true;
    this.editedAt = new Date();
    // Lưu nội dung gốc nếu chưa có
    if (!this.originalContent) {
      // Lấy nội dung cũ từ database
      this.constructor
        .findById(this._id)
        .select("content")
        .then((doc) => {
          if (doc && doc.content !== this.content) {
            this.originalContent = doc.content;
          }
        });
    }
  }
  next();
});

// Middleware cập nhật Thread count đơn giản
ForumReplySchema.post("save", async function (doc, next) {
  try {
    if (this.isNew && this.moderationStatus === "approved") {
      // Cập nhật reply count cho thread
      await this.model("ForumThread").findByIdAndUpdate(this.thread, {
        $inc: { replyCount: 1 },
        lastReplyTime: this.createdAt,
        lastReplyAuthor: this.author,
      });
    }
  } catch (err) {
    console.error("Error updating thread count:", err);
  }
  next();
});

// Method cập nhật count đơn giản
ForumReplySchema.methods.updateThreadCount = async function (
  oldStatus,
  newStatus
) {
  try {
    let countChange = 0;

    if (oldStatus !== "approved" && newStatus === "approved") {
      countChange = 1;
    } else if (oldStatus === "approved" && newStatus !== "approved") {
      countChange = -1;
    }

    if (countChange !== 0) {
      await this.model("ForumThread").findByIdAndUpdate(this.thread, {
        $inc: { replyCount: countChange },
      });
    }
  } catch (err) {
    console.error("Error updating thread count:", err);
  }
};

export default mongoose.model("ForumReply", ForumReplySchema);
