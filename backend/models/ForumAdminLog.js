import mongoose from "mongoose";

const ForumAdminLogSchema = new mongoose.Schema(
  {
    // Admin thực hiện hành động
    admin: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    // Loại hành động
    action: {
      type: String,
      enum: [
        // Category actions
        "category_created",
        "category_updated",
        "category_deleted",
        "category_activated",
        "category_deactivated",

        // Thread actions
        "thread_approved",
        "thread_rejected",
        "thread_deleted",
        "thread_restored",
        "thread_locked",
        "thread_unlocked",
        "thread_pinned",
        "thread_unpinned",
        "thread_moved",
        "thread_edited",

        // Reply actions
        "reply_approved",
        "reply_rejected",
        "reply_deleted",
        "reply_restored",
        "reply_edited",

        // User actions
        "user_warned",
        "user_suspended",
        "user_banned",
        "user_unbanned",
        "user_updated",
        "user_deleted",
        "user_activated",
        "user_deactivated",
        "user_status_changed",

        // Review actions
        "review_deleted",
        "review_updated",

        // Report actions
        "report_reviewed",
        "report_resolved",
        "report_dismissed",

        // System actions
        "bulk_delete",
        "bulk_approve",
        "settings_updated",
      ],
      required: true,
    },
    // Đối tượng bị tác động
    targetType: {
      type: String,
      enum: ["category", "thread", "reply", "user", "report", "system"],
      required: true,
    },
    // ID của đối tượng
    targetId: {
      type: mongoose.Schema.ObjectId,
      required: function () {
        return this.targetType !== "system";
      },
    },
    // Dữ liệu trước khi thay đổi (JSON)
    beforeData: {
      type: mongoose.Schema.Types.Mixed,
    },
    // Dữ liệu sau khi thay đổi (JSON)
    afterData: {
      type: mongoose.Schema.Types.Mixed,
    },
    // Lý do/ghi chú
    reason: {
      type: String,
      maxlength: [500, "Lý do không được vượt quá 500 ký tự"],
    },
    // Metadata bổ sung
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
    // IP address của admin
    ipAddress: {
      type: String,
    },
    // User agent
    userAgent: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Index để tăng hiệu suất
ForumAdminLogSchema.index({ admin: 1, createdAt: -1 });
ForumAdminLogSchema.index({ action: 1, createdAt: -1 });
ForumAdminLogSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });
ForumAdminLogSchema.index({ createdAt: -1 }); // Cho việc phân trang

// Static method để lấy thống kê hoạt động admin
ForumAdminLogSchema.statics.getAdminStats = function (timeRange = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - timeRange);

  return this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          admin: "$admin",
          action: "$action",
        },
        count: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "_id.admin",
        foreignField: "_id",
        as: "adminInfo",
      },
    },
    {
      $unwind: "$adminInfo",
    },
    {
      $group: {
        _id: "$adminInfo.username",
        actions: {
          $push: {
            action: "$_id.action",
            count: "$count",
          },
        },
        totalActions: { $sum: "$count" },
      },
    },
    {
      $sort: { totalActions: -1 },
    },
  ]);
};

// Static method để log hành động
ForumAdminLogSchema.statics.logAction = function (data) {
  return this.create({
    admin: data.admin,
    action: data.action,
    targetType: data.targetType,
    targetId: data.targetId,
    beforeData: data.beforeData,
    afterData: data.afterData,
    reason: data.reason,
    metadata: data.metadata,
    ipAddress: data.ipAddress,
    userAgent: data.userAgent,
  });
};

export default mongoose.model("ForumAdminLog", ForumAdminLogSchema);
