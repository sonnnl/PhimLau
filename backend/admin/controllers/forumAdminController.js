import asyncHandler from "express-async-handler";
import ForumCategory from "../../models/ForumCategory.js";
import ForumThread from "../../models/ForumThread.js";
import ForumReply from "../../models/ForumReply.js";
import ForumReport from "../../models/ForumReport.js";
import ForumAdminLog from "../../models/ForumAdminLog.js";
import User from "../../models/UserModel.js";

// ==================== CATEGORY MANAGEMENT ====================

// @desc    Get all categories for admin
// @route   GET /api/admin/forum/categories
// @access  Private/Admin
export const getAllCategories = asyncHandler(async (req, res) => {
  const categories = await ForumCategory.find({})
    .populate("createdBy lastModifiedBy", "username email")
    .sort({ order: 1, createdAt: -1 });

  res.json({
    success: true,
    data: categories,
    total: categories.length,
  });
});

// @desc    Create new category
// @route   POST /api/admin/forum/categories
// @access  Private/Admin
export const createCategory = asyncHandler(async (req, res) => {
  const { name, description, icon, color, order, allowedRoles } = req.body;

  if (!name) {
    res.status(400);
    throw new Error("Tên danh mục là bắt buộc");
  }

  const category = await ForumCategory.create({
    name,
    description,
    icon,
    color: color || "#007bff",
    order: order || 0,
    allowedRoles: allowedRoles || ["user"],
    createdBy: req.user._id,
    lastModifiedBy: req.user._id,
  });

  // Log admin action
  await ForumAdminLog.logAction({
    admin: req.user._id,
    action: "category_created",
    targetType: "category",
    targetId: category._id,
    afterData: { name, description, icon, color, order },
    ipAddress: req.ip,
    userAgent: req.get("User-Agent"),
  });

  const populatedCategory = await ForumCategory.findById(category._id).populate(
    "createdBy lastModifiedBy",
    "username email"
  );

  res.status(201).json({
    success: true,
    data: populatedCategory,
  });
});

// @desc    Update category
// @route   PUT /api/admin/forum/categories/:id
// @access  Private/Admin
export const updateCategory = asyncHandler(async (req, res) => {
  const category = await ForumCategory.findById(req.params.id);

  if (!category) {
    res.status(404);
    throw new Error("Không tìm thấy danh mục");
  }

  const beforeData = {
    name: category.name,
    description: category.description,
    icon: category.icon,
    color: category.color,
    order: category.order,
    isActive: category.isActive,
  };

  const { name, description, icon, color, order, isActive, allowedRoles } =
    req.body;

  category.name = name || category.name;
  category.description = description || category.description;
  category.icon = icon || category.icon;
  category.color = color || category.color;
  category.order = order !== undefined ? order : category.order;
  category.isActive = isActive !== undefined ? isActive : category.isActive;
  category.allowedRoles = allowedRoles || category.allowedRoles;
  category.lastModifiedBy = req.user._id;

  const updatedCategory = await category.save();

  // Log admin action
  await ForumAdminLog.logAction({
    admin: req.user._id,
    action: "category_updated",
    targetType: "category",
    targetId: category._id,
    beforeData,
    afterData: { name, description, icon, color, order, isActive },
    ipAddress: req.ip,
    userAgent: req.get("User-Agent"),
  });

  const populatedCategory = await ForumCategory.findById(
    updatedCategory._id
  ).populate("createdBy lastModifiedBy", "username email");

  res.json({
    success: true,
    data: populatedCategory,
  });
});

// @desc    Delete category
// @route   DELETE /api/admin/forum/categories/:id
// @access  Private/Admin
export const deleteCategory = asyncHandler(async (req, res) => {
  const category = await ForumCategory.findById(req.params.id);

  if (!category) {
    res.status(404);
    throw new Error("Không tìm thấy danh mục");
  }

  // Check if category has threads
  const threadCount = await ForumThread.countDocuments({
    category: category._id,
    isDeleted: false,
  });

  if (threadCount > 0) {
    res.status(400);
    throw new Error(
      `Không thể xóa danh mục có ${threadCount} bài viết. Vui lòng di chuyển hoặc xóa các bài viết trước.`
    );
  }

  await category.deleteOne();

  // Log admin action
  await ForumAdminLog.logAction({
    admin: req.user._id,
    action: "category_deleted",
    targetType: "category",
    targetId: category._id,
    beforeData: {
      name: category.name,
      description: category.description,
      threadCount,
    },
    reason: req.body.reason,
    ipAddress: req.ip,
    userAgent: req.get("User-Agent"),
  });

  res.json({
    success: true,
    message: "Đã xóa danh mục thành công",
  });
});

// ==================== THREAD MANAGEMENT ====================

// @desc    Get all threads for admin with filters
// @route   GET /api/admin/forum/threads
// @access  Private/Admin
export const getAllThreads = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  // Build filter
  let filter = {};

  if (req.query.category) {
    filter.category = req.query.category;
  }

  if (req.query.status) {
    if (req.query.status === "deleted") {
      filter.isDeleted = true;
    } else if (req.query.status === "active") {
      filter.isDeleted = false;
    }
  }

  if (req.query.moderation) {
    filter.moderationStatus = req.query.moderation;
  }

  if (req.query.author) {
    filter.author = req.query.author;
  }

  const threads = await ForumThread.find(filter)
    .populate("author", "username email avatarUrl")
    .populate("category", "name slug")
    .populate("lastReplyAuthor", "username avatarUrl")
    .populate("deletedBy moderatedBy", "username")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await ForumThread.countDocuments(filter);

  res.json({
    success: true,
    data: threads,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total,
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    },
  });
});

// @desc    Moderate thread (approve/reject)
// @route   PATCH /api/admin/forum/threads/:id/moderate
// @access  Private/Admin
export const moderateThread = asyncHandler(async (req, res) => {
  try {
    const { status, note } = req.body;

    // Validate status
    if (!["approved", "rejected", "pending"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Trạng thái không hợp lệ",
      });
    }

    // Find thread with proper population
    const thread = await ForumThread.findById(req.params.id)
      .populate("author", "username displayName email")
      .populate("category", "name");

    if (!thread) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy bài viết",
      });
    }

    // Store before data for logging
    const beforeData = {
      moderationStatus: thread.moderationStatus,
      isApproved: thread.isApproved,
      moderatedBy: thread.moderatedBy,
      moderationNote: thread.moderationNote,
    };

    const oldStatus = thread.moderationStatus;

    // ===== 🎯 UPDATE THREAD MODERATION WITH CONSISTENCY =====
    thread.moderationStatus = status;
    thread.isApproved = status === "approved"; // ✅ SYNC isApproved with moderationStatus
    thread.moderatedBy = req.user._id;
    thread.moderationNote = note || "";
    thread.moderatedAt = new Date();

    // ===== 🛡️ VALIDATE CONSISTENCY BEFORE SAVE =====
    console.log("🔍 Admin moderation update:", {
      threadId: thread._id,
      oldStatus: oldStatus,
      newStatus: status,
      isApproved: thread.isApproved,
      moderatedBy: req.user.username || req.user.displayName,
    });

    await thread.save();

    // 🔥 UPDATE THREAD COUNT IN CATEGORY
    try {
      if (oldStatus !== "approved" && status === "approved") {
        // Thread được approve lần đầu hoặc từ rejected/pending → approved
        await ForumCategory.findByIdAndUpdate(thread.category._id, {
          $inc: { threadCount: 1 },
        });
      } else if (oldStatus === "approved" && status !== "approved") {
        // Thread bị reject hoặc pending từ approved
        await ForumCategory.findByIdAndUpdate(thread.category._id, {
          $inc: { threadCount: -1 },
        });
      }
    } catch (categoryError) {
      console.error("❌ Error updating category count:", categoryError);
    }

    // 🔥 SEND MODERATION NOTIFICATION TO USER
    try {
      const { createModerationNotification } = await import(
        "./notificationController.js"
      );
      await createModerationNotification({
        userId: thread.author._id,
        threadId: thread._id,
        threadTitle: thread.title,
        status,
        note: note || "",
        moderatorName: req.user.username || req.user.displayName || "Admin",
      });
    } catch (notificationError) {
      console.error(
        "❌ Error sending moderation notification:",
        notificationError
      );
      // Don't fail the whole operation if notification fails
    }

    // 🔥 LOG ADMIN ACTION
    try {
      await ForumAdminLog.logAction({
        admin: req.user._id,
        action:
          status === "approved"
            ? "thread_approved"
            : status === "rejected"
            ? "thread_rejected"
            : "thread_pending",
        targetType: "thread",
        targetId: thread._id,
        beforeData,
        afterData: {
          moderationStatus: status,
          isApproved: status === "approved",
          moderationNote: note || "",
          moderatedAt: thread.moderatedAt,
        },
        reason: note || "",
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });
    } catch (logError) {
      console.error("❌ Error logging admin action:", logError);
    }

    // Get updated thread with full population
    const updatedThread = await ForumThread.findById(thread._id)
      .populate("author", "username email displayName")
      .populate("moderatedBy", "username displayName")
      .populate("category", "name slug");

    // Send success response
    res.json({
      success: true,
      data: updatedThread,
      message:
        status === "approved"
          ? "✅ Bài viết đã được phê duyệt"
          : status === "rejected"
          ? "❌ Bài viết đã bị từ chối"
          : "⏳ Bài viết đang chờ xét duyệt",
    });
  } catch (error) {
    console.error("❌ Error in moderateThread:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi kiểm duyệt bài viết",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @desc    Lock/Unlock thread
// @route   PATCH /api/admin/forum/threads/:id/lock
// @access  Private/Admin
export const toggleThreadLock = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const thread = await ForumThread.findById(req.params.id);

  if (!thread) {
    res.status(404);
    throw new Error("Không tìm thấy bài viết");
  }

  const wasLocked = thread.isLocked;
  thread.isLocked = !thread.isLocked;

  await thread.save();

  // Log admin action
  await ForumAdminLog.logAction({
    admin: req.user._id,
    action: thread.isLocked ? "thread_locked" : "thread_unlocked",
    targetType: "thread",
    targetId: thread._id,
    beforeData: { isLocked: wasLocked },
    afterData: { isLocked: thread.isLocked },
    reason,
    ipAddress: req.ip,
    userAgent: req.get("User-Agent"),
  });

  res.json({
    success: true,
    data: { isLocked: thread.isLocked },
    message: thread.isLocked ? "Đã khóa bài viết" : "Đã mở khóa bài viết",
  });
});

// @desc    Pin/Unpin thread
// @route   PATCH /api/admin/forum/threads/:id/pin
// @access  Private/Admin
export const toggleThreadPin = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const thread = await ForumThread.findById(req.params.id);

  if (!thread) {
    res.status(404);
    throw new Error("Không tìm thấy bài viết");
  }

  const wasPinned = thread.isPinned;
  thread.isPinned = !thread.isPinned;

  await thread.save();

  // Log admin action
  await ForumAdminLog.logAction({
    admin: req.user._id,
    action: thread.isPinned ? "thread_pinned" : "thread_unpinned",
    targetType: "thread",
    targetId: thread._id,
    beforeData: { isPinned: wasPinned },
    afterData: { isPinned: thread.isPinned },
    reason,
    ipAddress: req.ip,
    userAgent: req.get("User-Agent"),
  });

  res.json({
    success: true,
    data: { isPinned: thread.isPinned },
    message: thread.isPinned ? "Đã ghim bài viết" : "Đã bỏ ghim bài viết",
  });
});

// @desc    Soft delete thread
// @route   DELETE /api/admin/forum/threads/:id
// @access  Private/Admin
export const deleteThread = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const thread = await ForumThread.findById(req.params.id);

  if (!thread) {
    res.status(404);
    throw new Error("Không tìm thấy bài viết");
  }

  await thread.softDelete(req.user._id, reason);

  res.json({
    success: true,
    message: "Đã xóa bài viết thành công",
  });
});

// ==================== REPLY MANAGEMENT ====================

// @desc    Get all replies for admin
// @route   GET /api/admin/forum/replies
// @access  Private/Admin
export const getAllReplies = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  let filter = {};

  if (req.query.thread) {
    filter.thread = req.query.thread;
  }

  if (req.query.status) {
    if (req.query.status === "deleted") {
      filter.isDeleted = true;
    } else if (req.query.status === "active") {
      filter.isDeleted = false;
    }
  }

  if (req.query.moderation) {
    filter.moderationStatus = req.query.moderation;
  }

  const replies = await ForumReply.find(filter)
    .populate("author", "username email avatarUrl")
    .populate("thread", "title slug")
    .populate("deletedBy moderatedBy", "username")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await ForumReply.countDocuments(filter);

  res.json({
    success: true,
    data: replies,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total,
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    },
  });
});

// @desc    Delete reply
// @route   DELETE /api/admin/forum/replies/:id
// @access  Private/Admin
export const deleteReply = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const reply = await ForumReply.findById(req.params.id);

  if (!reply) {
    res.status(404);
    throw new Error("Không tìm thấy phản hồi");
  }

  await reply.softDelete(req.user._id, reason);

  res.json({
    success: true,
    message: "Đã xóa phản hồi thành công",
  });
});

// @desc    Moderate reply (approve/reject)
// @route   PATCH /api/admin/forum/replies/:id/moderate
// @access  Private/Admin
export const moderateReply = asyncHandler(async (req, res) => {
  try {
    const { status, note } = req.body;

    // Validate status
    if (!["approved", "rejected", "pending"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Trạng thái không hợp lệ",
      });
    }

    // Find reply with proper population
    const reply = await ForumReply.findById(req.params.id)
      .populate("author", "username displayName email")
      .populate("thread", "title slug");

    if (!reply) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy phản hồi",
      });
    }

    // Store before data for logging
    const beforeData = {
      moderationStatus: reply.moderationStatus,
      moderatedBy: reply.moderatedBy,
      moderationNote: reply.moderationNote,
    };

    const oldStatus = reply.moderationStatus;

    // Update reply moderation
    reply.moderationStatus = status;
    reply.moderatedBy = req.user._id;
    reply.moderationNote = note || "";
    reply.moderatedAt = new Date();

    await reply.save();

    // 🔥 UPDATE THREAD REPLY COUNT using new method
    try {
      await reply.updateThreadCount(oldStatus, status);
    } catch (threadError) {
      console.error("❌ Error updating thread count:", threadError);
    }

    // 🔥 SEND MODERATION NOTIFICATION TO USER
    try {
      const { createModerationNotification } = await import(
        "./notificationController.js"
      );
      await createModerationNotification({
        userId: reply.author._id,
        threadId: reply.thread._id,
        threadTitle: `Trả lời trong "${reply.thread.title}"`,
        status,
        note: note || "",
        moderatorName: req.user.username || req.user.displayName || "Admin",
      });
    } catch (notificationError) {
      console.error(
        "❌ Error sending moderation notification:",
        notificationError
      );
    }

    // 🔥 LOG ADMIN ACTION
    try {
      await ForumAdminLog.logAction({
        admin: req.user._id,
        action:
          status === "approved"
            ? "reply_approved"
            : status === "rejected"
            ? "reply_rejected"
            : "reply_pending",
        targetType: "reply",
        targetId: reply._id,
        beforeData,
        afterData: {
          moderationStatus: status,
          moderationNote: note || "",
          moderatedAt: reply.moderatedAt,
        },
        reason: note || "",
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });
    } catch (logError) {
      console.error("❌ Error logging admin action:", logError);
    }

    // Get updated reply with full population
    const updatedReply = await ForumReply.findById(reply._id)
      .populate("author", "username email displayName")
      .populate("moderatedBy", "username displayName")
      .populate("thread", "title slug");

    // Send success response
    res.json({
      success: true,
      data: updatedReply,
      message:
        status === "approved"
          ? "✅ Phản hồi đã được phê duyệt"
          : status === "rejected"
          ? "❌ Phản hồi đã bị từ chối"
          : "⏳ Phản hồi đang chờ xét duyệt",
    });
  } catch (error) {
    console.error("❌ Error in moderateReply:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi kiểm duyệt phản hồi",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// ==================== REPORT MANAGEMENT ====================

// @desc    Get all reports for admin with filters and pagination
// @route   GET /api/admin/forum/reports
// @access  Private/Admin
export const getAllReports = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  // 🔍 BUILD FILTER QUERY
  let filter = {};

  // Filter by status
  if (req.query.status) {
    filter.status = req.query.status;
  }

  // Filter by report type
  if (req.query.reportType) {
    filter.reportType = req.query.reportType;
  }

  // Filter by reason
  if (req.query.reason) {
    filter.reason = req.query.reason;
  }

  // Filter by priority
  if (req.query.priority) {
    filter.priority = req.query.priority;
  }

  // Filter by date range
  if (req.query.fromDate || req.query.toDate) {
    filter.createdAt = {};
    if (req.query.fromDate) {
      filter.createdAt.$gte = new Date(req.query.fromDate);
    }
    if (req.query.toDate) {
      filter.createdAt.$lte = new Date(req.query.toDate);
    }
  }

  // 📊 GET REPORTS WITH PAGINATION
  const reports = await ForumReport.find(filter)
    .populate("reporter", "displayName avatarUrl email")
    .populate("reviewedBy", "displayName email")
    .sort({ createdAt: -1, priority: 1 })
    .skip(skip)
    .limit(limit);

  // 🔗 POPULATE TARGET CONTENT BASED ON REPORT TYPE
  for (let report of reports) {
    if (report.reportType === "thread") {
      report.targetId = await ForumThread.findById(report.targetId)
        .populate("author", "displayName avatarUrl email")
        .select("title content author createdAt");
    } else if (report.reportType === "reply") {
      report.targetId = await ForumReply.findById(report.targetId)
        .populate("author", "displayName avatarUrl email")
        .select("content author createdAt");
    }
  }

  const totalReports = await ForumReport.countDocuments(filter);
  const totalPages = Math.ceil(totalReports / limit);

  // 📈 GET STATISTICS
  const stats = await ForumReport.aggregate([
    { $match: filter },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  const priorityStats = await ForumReport.aggregate([
    { $match: filter },
    {
      $group: {
        _id: "$priority",
        count: { $sum: 1 },
      },
    },
  ]);

  res.json({
    success: true,
    data: reports,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems: totalReports,
      limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
    stats: {
      byStatus: stats,
      byPriority: priorityStats,
      total: totalReports,
    },
  });
});

// @desc    Update report status and take action
// @route   PUT /api/admin/forum/reports/:id
// @access  Private/Admin
export const updateReport = asyncHandler(async (req, res) => {
  const { status, actionTaken, adminNote, priority } = req.body;

  const report = await ForumReport.findById(req.params.id).populate(
    "reporter",
    "displayName email"
  );

  if (!report) {
    res.status(404);
    throw new Error("Không tìm thấy báo cáo");
  }

  // 🔗 POPULATE TARGET CONTENT BASED ON REPORT TYPE
  if (report.reportType === "thread") {
    report.targetId = await ForumThread.findById(report.targetId)
      .populate("author", "displayName avatarUrl email")
      .select("title content author createdAt");
  } else if (report.reportType === "reply") {
    report.targetId = await ForumReply.findById(report.targetId)
      .populate("author", "displayName avatarUrl email")
      .select("content author createdAt");
  }

  // 📝 SAVE BEFORE STATE FOR LOGGING
  const beforeData = {
    status: report.status,
    priority: report.priority,
    adminNote: report.adminNote,
    actionTaken: report.actionTaken,
  };

  // 🔄 UPDATE REPORT
  if (status) report.status = status;
  if (priority) report.priority = priority;
  if (adminNote) report.adminNote = adminNote;
  if (actionTaken) report.actionTaken = actionTaken;

  if (status === "resolved" || status === "dismissed") {
    report.reviewedBy = req.user._id;
    report.reviewedAt = new Date();
  }

  const updatedReport = await report.save();

  // 🎯 APPLY ACTIONS TO TARGET CONTENT
  if (actionTaken && actionTaken !== "none" && report.targetId) {
    try {
      await applyModerationAction(
        report.reportType,
        report.targetId,
        actionTaken,
        req.user._id,
        adminNote
      );
    } catch (error) {
      console.error("❌ Error applying moderation action:", error);
    }
  }

  // 📝 LOG ADMIN ACTION
  const logAction =
    status === "resolved"
      ? "report_resolved"
      : status === "dismissed"
      ? "report_dismissed"
      : "report_reviewed";

  await ForumAdminLog.logAction({
    admin: req.user._id,
    action: logAction,
    targetType: "report",
    targetId: report._id,
    beforeData,
    afterData: { status, actionTaken, adminNote, priority },
    reason: `Report updated: ${status}`,
    ipAddress: req.ip,
    userAgent: req.get("User-Agent"),
  });

  const populatedReport = await ForumReport.findById(
    updatedReport._id
  ).populate("reporter reviewedBy", "displayName email");

  // 🔗 POPULATE TARGET CONTENT BASED ON REPORT TYPE
  if (populatedReport.reportType === "thread") {
    populatedReport.targetId = await ForumThread.findById(
      populatedReport.targetId
    )
      .populate("author", "displayName avatarUrl email")
      .select("title content author createdAt");
  } else if (populatedReport.reportType === "reply") {
    populatedReport.targetId = await ForumReply.findById(
      populatedReport.targetId
    )
      .populate("author", "displayName avatarUrl email")
      .select("content author createdAt");
  }

  res.json({
    success: true,
    data: populatedReport,
    message: "Cập nhật báo cáo thành công",
  });
});

// @desc    Bulk update multiple reports
// @route   PUT /api/admin/forum/reports/bulk
// @access  Private/Admin
export const bulkUpdateReports = asyncHandler(async (req, res) => {
  const { reportIds, status, actionTaken, adminNote } = req.body;

  if (!reportIds || !Array.isArray(reportIds) || reportIds.length === 0) {
    res.status(400);
    throw new Error("Vui lòng cung cấp danh sách ID báo cáo");
  }

  const updateData = {};
  if (status) updateData.status = status;
  if (actionTaken) updateData.actionTaken = actionTaken;
  if (adminNote) updateData.adminNote = adminNote;

  if (status === "resolved" || status === "dismissed") {
    updateData.reviewedBy = req.user._id;
    updateData.reviewedAt = new Date();
  }

  const result = await ForumReport.updateMany(
    { _id: { $in: reportIds } },
    updateData
  );

  // 📝 LOG BULK ACTION
  await ForumAdminLog.logAction({
    admin: req.user._id,
    action: "bulk_approve", // Sử dụng action có sẵn trong enum
    targetType: "report",
    targetId: null,
    afterData: { reportIds, ...updateData },
    reason: `Bulk updated ${reportIds.length} reports`,
    ipAddress: req.ip,
    userAgent: req.get("User-Agent"),
  });

  res.json({
    success: true,
    message: `Đã cập nhật ${result.modifiedCount} báo cáo`,
    updated: result.modifiedCount,
  });
});

// @desc    Get report statistics
// @route   GET /api/admin/forum/reports/stats
// @access  Private/Admin
export const getReportStats = asyncHandler(async (req, res) => {
  const { timeframe = "7d" } = req.query;

  // Calculate date range
  const now = new Date();
  let startDate;

  switch (timeframe) {
    case "24h":
      startDate = new Date(now - 24 * 60 * 60 * 1000);
      break;
    case "7d":
      startDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
      break;
    case "30d":
      startDate = new Date(now - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
  }

  // 📊 COMPREHENSIVE REPORT ANALYTICS
  const [
    totalStats,
    statusBreakdown,
    reasonBreakdown,
    priorityBreakdown,
    dailyTrends,
    topReporters,
    responseTimeStats,
  ] = await Promise.all([
    // Total counts
    ForumReport.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          pending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
          resolved: {
            $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] },
          },
          dismissed: {
            $sum: { $cond: [{ $eq: ["$status", "dismissed"] }, 1, 0] },
          },
        },
      },
    ]),

    // Status breakdown
    ForumReport.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),

    // Reason breakdown
    ForumReport.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: "$reason", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),

    // Priority breakdown
    ForumReport.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: "$priority", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),

    // Daily trends
    ForumReport.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),

    // Top reporters
    ForumReport.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: "$reporter", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
    ]),

    // Response time stats
    ForumReport.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          reviewedAt: { $exists: true },
        },
      },
      {
        $project: {
          responseTime: { $subtract: ["$reviewedAt", "$createdAt"] },
        },
      },
      {
        $group: {
          _id: null,
          avgResponseTime: { $avg: "$responseTime" },
          minResponseTime: { $min: "$responseTime" },
          maxResponseTime: { $max: "$responseTime" },
        },
      },
    ]),
  ]);

  res.json({
    success: true,
    timeframe,
    data: {
      overview: totalStats[0] || {
        total: 0,
        pending: 0,
        resolved: 0,
        dismissed: 0,
      },
      statusBreakdown,
      reasonBreakdown,
      priorityBreakdown,
      dailyTrends,
      topReporters,
      responseTime: responseTimeStats[0] || null,
    },
  });
});

// 🎯 HELPER FUNCTION: Apply moderation action to content
const applyModerationAction = async (
  reportType,
  targetId,
  actionTaken,
  adminId,
  reason
) => {
  // First, get the target content to find its author
  let targetContent = null;
  let authorId = null;

  if (reportType === "thread") {
    targetContent = await ForumThread.findById(targetId);
    authorId = targetContent?.author;
  } else if (reportType === "reply") {
    targetContent = await ForumReply.findById(targetId);
    authorId = targetContent?.author;
  }

  if (!targetContent) {
    throw new Error("Không tìm thấy nội dung được báo cáo");
  }

  const updateData = {
    moderatedBy: adminId,
    moderationNote: reason,
    moderationStatus: "reviewed",
  };

  switch (actionTaken) {
    case "content_removed":
      // Xóa nội dung
      updateData.isDeleted = true;
      updateData.deletedAt = new Date();
      updateData.deletedBy = adminId;
      updateData.deleteReason = reason;
      updateData.moderationStatus = "rejected";
      if (reportType === "thread") {
        updateData.isApproved = false; // ✅ SYNC isApproved for thread
      }

      // Gửi thông báo cho tác giả
      if (authorId) {
        await createContentRemovedNotification(
          authorId,
          reason,
          adminId,
          reportType,
          targetContent.slug
        );
      }
      break;

    case "content_edited":
      // Đánh dấu cần chỉnh sửa
      updateData.moderationStatus = "approved";
      if (reportType === "thread") {
        updateData.isApproved = true; // ✅ SYNC isApproved for thread
      }
      updateData.requiresEditing = true;
      updateData.editingNote = reason;

      // Gửi thông báo cho tác giả
      if (authorId) {
        await createContentEditedNotification(
          authorId,
          reason,
          adminId,
          reportType,
          targetContent.slug
        );
      }
      break;

    case "warning_sent":
      // Gửi cảnh báo cho tác giả
      updateData.moderationStatus = "approved";
      if (reportType === "thread") {
        updateData.isApproved = true; // ✅ SYNC isApproved for thread
      }
      if (authorId) {
        // Tạo notification warning cho user
        await createWarningNotification(authorId, reason, adminId);
      }
      break;

    case "user_suspended":
      // Tạm khóa tài khoản
      updateData.moderationStatus = "rejected";
      if (reportType === "thread") {
        updateData.isApproved = false; // ✅ SYNC isApproved for thread
      }
      if (authorId) {
        // Lấy thời gian suspend từ reason (format: "reason|days") hoặc mặc định 7 ngày
        let suspensionDays = 7;
        let actualReason = reason;

        if (reason && reason.includes("|")) {
          const parts = reason.split("|");
          actualReason = parts[0];
          suspensionDays = parseInt(parts[1]) || 7;
        }

        await User.findByIdAndUpdate(authorId, {
          status: "suspended",
          suspendedBy: adminId,
          suspendedAt: new Date(),
          suspensionReason: actualReason,
          suspensionExpires: new Date(
            Date.now() + suspensionDays * 24 * 60 * 60 * 1000
          ),
        });
        await createSuspensionNotification(
          authorId,
          actualReason,
          suspensionDays,
          adminId
        );
      }
      break;

    case "user_banned":
      // Cấm vĩnh viễn
      updateData.moderationStatus = "rejected";
      if (reportType === "thread") {
        updateData.isApproved = false; // ✅ SYNC isApproved for thread
      }
      if (authorId) {
        await User.findByIdAndUpdate(authorId, {
          status: "banned",
          bannedBy: adminId,
          bannedAt: new Date(),
          banReason: reason,
        });
        await createBanNotification(authorId, reason, adminId);
      }
      break;

    default:
      // No action or other actions
      break;
  }

  // ===== 🛡️ ENSURE CONSISTENCY BEFORE UPDATE =====
  updateData = ensureThreadModerationConsistency(updateData, reportType);

  console.log("🔍 Applying moderation action:", {
    reportType,
    targetId,
    actionTaken,
    finalUpdateData: {
      moderationStatus: updateData.moderationStatus,
      isApproved: updateData.isApproved,
      isDeleted: updateData.isDeleted,
    },
  });

  if (reportType === "thread") {
    await ForumThread.findByIdAndUpdate(targetId, updateData);
  } else {
    await ForumReply.findByIdAndUpdate(targetId, updateData);
  }

  // Log the moderation action - sử dụng action phù hợp với enum
  let logAction = "settings_updated"; // fallback action

  if (reportType === "thread") {
    logAction =
      actionTaken === "content_removed"
        ? "thread_deleted"
        : actionTaken === "user_suspended"
        ? "user_suspended"
        : actionTaken === "user_banned"
        ? "user_banned"
        : "thread_approved";
  } else if (reportType === "reply") {
    logAction =
      actionTaken === "content_removed"
        ? "reply_deleted"
        : actionTaken === "user_suspended"
        ? "user_suspended"
        : actionTaken === "user_banned"
        ? "user_banned"
        : "reply_approved";
  }

  await ForumAdminLog.logAction({
    admin: adminId,
    action: logAction,
    targetType: reportType,
    targetId: targetId,
    afterData: {
      actionTaken,
      reason,
      targetAuthor: authorId,
    },
    reason: `Applied moderation action: ${actionTaken}`,
  });
};

// ===== 🛡️ UTILITY FUNCTION FOR THREAD MODERATION CONSISTENCY =====
const ensureThreadModerationConsistency = (updateData, reportType) => {
  if (reportType === "thread" && updateData.moderationStatus) {
    // Đảm bảo isApproved luôn sync với moderationStatus
    updateData.isApproved = updateData.moderationStatus === "approved";

    console.log("🔧 Thread moderation consistency applied:", {
      moderationStatus: updateData.moderationStatus,
      isApproved: updateData.isApproved,
    });
  }
  return updateData;
};

// Helper function to create warning notification
const createWarningNotification = async (userId, reason, adminId) => {
  try {
    // Import Notification model dynamically to avoid circular dependency
    const { default: Notification } = await import(
      "../../models/NotificationModel.js"
    );

    const notification = await Notification.create({
      recipient: userId,
      type: "moderation_warning",
      title: "⚠️ Cảnh báo vi phạm quy định",
      message: `Nội dung của bạn đã vi phạm quy định cộng đồng. Lý do: ${reason}`,
      priority: "high",
      relatedData: {
        moderatorId: adminId,
        reason: reason,
        severity: "warning",
      },
    });

    // Emit real-time notification
    const io = global.io;
    if (io) {
      io.to(`user_${userId}`).emit("notification", {
        id: notification._id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        priority: notification.priority,
        createdAt: notification.createdAt,
        isRead: false,
      });
    }

    console.log(`📧 Warning notification sent to user ${userId}`);
  } catch (error) {
    console.error("Error creating warning notification:", error);
  }
};

// Helper function to create suspension notification
const createSuspensionNotification = async (userId, reason, days, adminId) => {
  try {
    const { default: Notification } = await import(
      "../../models/NotificationModel.js"
    );

    const notification = await Notification.create({
      recipient: userId,
      type: "account_suspended",
      title: "🚫 Tài khoản bị tạm khóa",
      message: `Tài khoản của bạn đã bị tạm khóa ${days} ngày. Lý do: ${reason}`,
      priority: "urgent",
      relatedData: {
        moderatorId: adminId,
        reason: reason,
        suspensionDays: days,
        severity: "suspension",
        expiresAt: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
      },
    });

    // Emit real-time notification
    const io = global.io;
    if (io) {
      io.to(`user_${userId}`).emit("notification", {
        id: notification._id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        priority: notification.priority,
        createdAt: notification.createdAt,
        isRead: false,
      });
    }

    console.log(
      `📧 Suspension notification sent to user ${userId} for ${days} days`
    );
  } catch (error) {
    console.error("Error creating suspension notification:", error);
  }
};

const createBanNotification = async (userId, reason, adminId) => {
  try {
    const { default: Notification } = await import(
      "../../models/NotificationModel.js"
    );

    const notification = await Notification.create({
      recipient: userId,
      type: "account_banned",
      title: "🔒 Tài khoản bị cấm vĩnh viễn",
      message: `Tài khoản của bạn đã bị cấm vĩnh viễn. Lý do: ${reason}`,
      priority: "urgent",
      relatedData: {
        moderatorId: adminId,
        reason: reason,
        severity: "ban",
        bannedAt: new Date(),
      },
    });

    // Emit real-time notification
    const io = global.io;
    if (io) {
      io.to(`user_${userId}`).emit("notification", {
        id: notification._id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        priority: notification.priority,
        createdAt: notification.createdAt,
        isRead: false,
      });
    }

    console.log(`📧 Ban notification sent to user ${userId}`);
  } catch (error) {
    console.error("Error creating ban notification:", error);
  }
};

// ========================================================================================
// FINAL, CORRECTED VERSION OF NOTIFICATION HELPERS AND REPORT RESOLVERS
// REPLACING ALL PREVIOUS VERSIONS AND DUPLICATES
// ========================================================================================

// Helper function to create content removed notification
const createContentRemovedNotification = async (
  userId,
  reason,
  adminId,
  contentType,
  link
) => {
  try {
    const { default: Notification } = await import(
      "../../models/NotificationModel.js"
    );

    const contentTypeText = contentType === "thread" ? "bài viết" : "phản hồi";

    const notification = await Notification.create({
      recipient: userId,
      type: "content_removed",
      title: `🗑️ ${contentTypeText} đã bị xóa`,
      message: `${contentTypeText} của bạn đã bị xóa do vi phạm quy định. Lý do: ${reason}`,
      priority: "high",
      link: link,
      relatedData: {
        moderatorId: adminId,
        reason: reason,
        contentType: contentType,
        severity: "content_removal",
      },
    });

    // Emit real-time notification
    const io = global.io;
    if (io) {
      io.to(`user_${userId}`).emit("notification", {
        id: notification._id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        priority: notification.priority,
        link: notification.link,
        createdAt: notification.createdAt,
        isRead: false,
      });
    }

    console.log(`📧 Content removed notification sent to user ${userId}`);
  } catch (error) {
    console.error("Error creating content removed notification:", error);
  }
};

// Helper function to create content edited notification
const createContentEditedNotification = async (
  userId,
  reason,
  adminId,
  contentType,
  link
) => {
  try {
    const { default: Notification } = await import(
      "../../models/NotificationModel.js"
    );

    const contentTypeText = contentType === "thread" ? "bài viết" : "phản hồi";

    const notification = await Notification.create({
      recipient: userId,
      type: "content_edited",
      title: `✏️ ${contentTypeText} cần chỉnh sửa`,
      message: `${contentTypeText} của bạn cần được chỉnh sửa. Lý do: ${reason}`,
      priority: "normal",
      link: link,
      relatedData: {
        moderatorId: adminId,
        reason: reason,
        contentType: contentType,
        severity: "content_edit",
      },
    });

    // Emit real-time notification
    const io = global.io;
    if (io) {
      io.to(`user_${userId}`).emit("notification", {
        id: notification._id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        priority: notification.priority,
        link: notification.link,
        createdAt: notification.createdAt,
        isRead: false,
      });
    }

    console.log(`📧 Content edited notification sent to user ${userId}`);
  } catch (error) {
    console.error("Error creating content edited notification:", error);
  }
};

// @desc    Resolve a single report (legacy function for compatibility)
// @route   PATCH /api/admin/forum/reports/:id/resolve
// @access  Private/Admin
export const resolveReport = asyncHandler(async (req, res) => {
  const { status = "resolved", actionTaken = "none", adminNote } = req.body;

  const report = await ForumReport.findById(req.params.id);

  if (!report) {
    res.status(404);
    throw new Error("Không tìm thấy báo cáo");
  }

  // Update report
  report.status = status;
  report.actionTaken = actionTaken;
  report.adminNote = adminNote;
  report.reviewedBy = req.user._id;
  report.reviewedAt = new Date();

  const updatedReport = await report.save();

  // Apply moderation action if needed
  if (actionTaken && actionTaken !== "none") {
    try {
      await applyModerationAction(
        report.reportType,
        report.targetId,
        actionTaken,
        req.user._id,
        adminNote
      );
    } catch (error) {
      console.error("❌ Error applying moderation action:", error);
    }
  }

  // Log admin action
  await ForumAdminLog.logAction({
    admin: req.user._id,
    action: "report_resolved",
    targetType: "report",
    targetId: report._id,
    afterData: { status, actionTaken, adminNote },
    reason: `Report resolved: ${status}`,
    ipAddress: req.ip,
    userAgent: req.get("User-Agent"),
  });

  res.json({
    success: true,
    data: updatedReport,
    message: "Báo cáo đã được xử lý thành công",
  });
});

// ==================== STATISTICS ====================

// @desc    Get forum statistics
// @route   GET /api/admin/forum/stats
// @access  Private/Admin
export const getForumStats = asyncHandler(async (req, res) => {
  const [
    totalCategories,
    activeCategories,
    totalThreads,
    activeThreads,
    pendingThreads,
    totalReplies,
    activeReplies,
    totalReports,
    pendingReports,
  ] = await Promise.all([
    ForumCategory.countDocuments(),
    ForumCategory.countDocuments({ isActive: true }),
    ForumThread.countDocuments(),
    ForumThread.countDocuments({ isDeleted: false }),
    ForumThread.countDocuments({ moderationStatus: "pending" }),
    ForumReply.countDocuments(),
    ForumReply.countDocuments({ isDeleted: false }),
    ForumReport.countDocuments(),
    ForumReport.countDocuments({ status: "pending" }),
  ]);

  // Recent activity (last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [recentThreads, recentReplies, recentReports] = await Promise.all([
    ForumThread.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
    ForumReply.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
    ForumReport.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
  ]);

  res.json({
    success: true,
    data: {
      categories: {
        total: totalCategories,
        active: activeCategories,
      },
      threads: {
        total: totalThreads,
        active: activeThreads,
        pending: pendingThreads,
        recent: recentThreads,
      },
      replies: {
        total: totalReplies,
        active: activeReplies,
        recent: recentReplies,
      },
      reports: {
        total: totalReports,
        pending: pendingReports,
        recent: recentReports,
      },
    },
  });
});

export const resolveReportAndDeleteContent = asyncHandler(async (req, res) => {
  const { reportId } = req.params;
  const adminUser = req.user;

  const report = await ForumReport.findById(reportId);

  if (!report) {
    res.status(404);
    throw new Error("Báo cáo không tồn tại");
  }

  if (report.status === "resolved") {
    res.status(400);
    throw new Error("Báo cáo này đã được xử lý");
  }

  let target;
  if (report.reportType === "thread") {
    target = await ForumThread.findById(report.targetId);
  } else {
    target = await ForumReply.findById(report.targetId);
  }

  if (!target || target.isDeleted) {
    report.status = "resolved";
    report.actionTaken = "content_already_deleted";
    report.reviewedBy = adminUser._id;
    report.reviewedAt = new Date();
    await report.save();
    return res.status(200).json({
      success: true,
      message: "Nội dung đã bị xóa trước đó. Báo cáo đã được đóng.",
    });
  }

  const authorId = target.author;

  // Soft delete the content
  const wasAlreadyDeleted = target.isDeleted;
  target.isDeleted = true;
  target.deletedBy = adminUser._id;
  target.deletedAt = new Date();
  target.moderationStatus = "rejected";
  if (report.reportType === "thread") {
    target.isApproved = false;
  }
  await target.save();

  // Update counters if it wasn't already deleted
  if (!wasAlreadyDeleted) {
    if (report.reportType === "thread") {
      await ForumCategory.findByIdAndUpdate(target.category, {
        $inc: { threadCount: -1 },
      });
    } else if (report.reportType === "reply") {
      await ForumThread.findByIdAndUpdate(target.thread, {
        $inc: { replyCount: -1 },
      });
    }
  }

  // Notify the author
  if (adminUser._id.toString() !== authorId.toString()) {
    const threadForReply =
      report.reportType === "reply"
        ? await ForumThread.findById(target.thread, "slug")
        : null;

    const contextLink = threadForReply
      ? `/forums/threads/${threadForReply.slug}`
      : `/forums/threads/${target.slug}`;

    await createContentRemovedNotification(
      authorId,
      `Nội dung của bạn đã bị xóa do vi phạm quy định.`,
      adminUser._id,
      report.reportType,
      contextLink
    );
  }

  // Resolve the report
  report.status = "resolved";
  report.actionTaken = "content_removed";
  report.reviewedBy = adminUser._id;
  report.reviewedAt = new Date();
  await report.save();

  res.status(200).json({
    success: true,
    message: "Nội dung đã được xóa và báo cáo đã được xử lý.",
  });
});

export const resolveReportAndRequestEdit = asyncHandler(async (req, res) => {
  const { reportId } = req.params;
  const { reason } = req.body;
  const adminUser = req.user;

  if (!reason) {
    res.status(400);
    throw new Error("Vui lòng cung cấp lý do yêu cầu chỉnh sửa.");
  }

  const report = await ForumReport.findById(reportId);

  if (!report) {
    res.status(404);
    throw new Error("Báo cáo không tồn tại");
  }

  if (report.status === "resolved") {
    res.status(400);
    throw new Error("Báo cáo này đã được xử lý");
  }

  let target;
  if (report.reportType === "thread") {
    target = await ForumThread.findById(report.targetId);
  } else {
    target = await ForumReply.findById(report.targetId);
  }

  if (!target || target.isDeleted) {
    report.status = "resolved";
    report.actionTaken = "content_already_deleted";
    report.reviewedBy = adminUser._id;
    report.reviewedAt = new Date();
    await report.save();
    return res.status(200).json({
      success: true,
      message: "Nội dung đã bị xóa trước đó. Báo cáo đã được đóng.",
    });
  }

  const authorId = target.author;

  // Mark content as requires editing
  target.requiresEditing = true;
  target.editingNote = reason;
  await target.save();

  // Notify the author
  if (adminUser._id.toString() !== authorId.toString()) {
    const threadForReply =
      report.reportType === "reply"
        ? await ForumThread.findById(target.thread, "slug")
        : null;

    const editLink =
      report.reportType === "thread"
        ? `/forums/threads/${target.slug}`
        : `/forums/threads/${threadForReply?.slug}?replyId=${target._id}`;

    await createContentEditedNotification(
      authorId,
      reason,
      adminUser._id,
      report.reportType,
      editLink
    );
  }

  // Resolve the report
  report.status = "resolved";
  report.actionTaken = "content_edited";
  report.reviewedBy = adminUser._id;
  report.reviewedAt = new Date();
  await report.save();

  res.status(200).json({
    success: true,
    message: "Đã yêu cầu người dùng chỉnh sửa và báo cáo đã được xử lý.",
  });
});
