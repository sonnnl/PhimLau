import mongoose from "mongoose";

const ForumReportSchema = new mongoose.Schema(
  {
    // Loại báo cáo
    reportType: {
      type: String,
      enum: ["thread", "reply"],
      required: true,
    },
    // ID của thread hoặc reply bị báo cáo
    targetId: {
      type: mongoose.Schema.ObjectId,
      required: true,
      refPath: 'reportType === "thread" ? "ForumThread" : "ForumReply"',
    },
    // Người báo cáo
    reporter: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    // Lý do báo cáo
    reason: {
      type: String,
      enum: [
        "spam",
        "harassment",
        "inappropriate_content",
        "violence",
        "hate_speech",
        "copyright",
        "false_information",
        "other",
      ],
      required: true,
    },
    // Mô tả chi tiết
    description: {
      type: String,
      maxlength: [500, "Mô tả không được vượt quá 500 ký tự"],
    },
    // Trạng thái xử lý
    status: {
      type: String,
      enum: ["pending", "reviewed", "resolved", "dismissed"],
      default: "pending",
    },
    // Admin xử lý
    reviewedBy: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
    // Thời gian xử lý
    reviewedAt: {
      type: Date,
    },
    // Ghi chú của admin
    adminNote: {
      type: String,
      maxlength: [300, "Ghi chú admin không được vượt quá 300 ký tự"],
    },
    // Hành động đã thực hiện
    actionTaken: {
      type: String,
      enum: [
        "none",
        "warning_sent",
        "content_removed",
        "user_suspended",
        "user_banned",
        "content_edited",
        "content_already_deleted",
      ],
      default: "none",
    },
    // Độ ưu tiên
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
  },
  {
    timestamps: true,
  }
);

// Index để tăng hiệu suất
ForumReportSchema.index({ status: 1, priority: -1, createdAt: -1 });
ForumReportSchema.index({ reporter: 1, createdAt: -1 });
ForumReportSchema.index({ targetId: 1, reportType: 1 });
ForumReportSchema.index({ reviewedBy: 1, reviewedAt: -1 });

// Validation cơ bản cho dự án học thuật

// Method để xử lý báo cáo
ForumReportSchema.methods.resolve = function (adminId, action, note) {
  this.status = "resolved";
  this.reviewedBy = adminId;
  this.reviewedAt = new Date();
  this.actionTaken = action;
  if (note) this.adminNote = note;
  return this.save();
};

// Static method để thống kê báo cáo
ForumReportSchema.statics.getReportStats = function () {
  return this.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);
};

export default mongoose.model("ForumReport", ForumReportSchema);
