import asyncHandler from "express-async-handler";
import User from "../../models/UserModel.js";
import Review from "../../models/ReviewModel.js";
import ForumThread from "../../models/ForumThread.js";
import ForumReply from "../../models/ForumReply.js";
import ForumAdminLog from "../../models/ForumAdminLog.js";

// @desc    Get admin dashboard statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
const getDashboardStats = asyncHandler(async (req, res) => {
  // ✅ SIMPLE: Business logic only, middleware handles cache
  try {
    const totalUsers = await User.countDocuments();
    const adminUsers = await User.countDocuments({ role: "admin" });
    const regularUsers = await User.countDocuments({ role: "user" });

    // Recent users (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentUsers = await User.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
    });

    // Active users (logged in last 30 days) - placeholder
    const activeUsers = Math.floor(totalUsers * 0.7); // Estimate

    // Get review stats
    const totalReviews = await Review.countDocuments();
    const recentReviews = await Review.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
    });
    const avgRatingResult = await Review.aggregate([
      { $group: { _id: null, avgRating: { $avg: "$rating" } } },
    ]);
    const avgRating =
      avgRatingResult.length > 0 ? avgRatingResult[0].avgRating.toFixed(1) : 0;

    // Get forum stats
    const totalThreads = await ForumThread.countDocuments();
    const recentThreads = await ForumThread.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
    });
    const totalReplies = await ForumReply.countDocuments();
    const recentReplies = await ForumReply.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
    });

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          admin: adminUsers,
          regular: regularUsers,
          recent: recentUsers,
          active: activeUsers,
        },
        reviews: {
          total: totalReviews,
          recent: recentReviews,
          averageRating: avgRating,
        },
        forum: {
          totalThreads,
          recentThreads,
          totalReplies,
          recentReplies,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thống kê dashboard",
    });
  }
});

// @desc    Get all users with pagination and filters
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = asyncHandler(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const role = req.query.role || "";
    const status = req.query.status || "";

    const skip = (page - 1) * limit;

    // Build query
    let query = {};
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { displayName: { $regex: search, $options: "i" } },
      ];
    }
    if (role) {
      query.role = role;
    }
    if (status) {
      query.status = status;
    }

    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users,
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
      message: "Lỗi server khi lấy danh sách users",
      error: error.message,
    });
  }
});

// @desc    Update user role
// @route   PATCH /api/admin/users/:id/role
// @access  Private/Admin
const updateUserRole = asyncHandler(async (req, res) => {
  try {
    const { role } = req.body;
    const userId = req.params.id;

    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Role không hợp lệ",
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy user",
      });
    }

    // Log the action
    await ForumAdminLog.logAction({
      admin: req.user._id,
      action: "user_updated",
      targetType: "user",
      targetId: user._id,
      reason: `Changed role to ${role}`,
      metadata: { username: user.username },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: `Đã cập nhật quyền thành ${role}`,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi server khi cập nhật quyền",
      error: error.message,
    });
  }
});

// @desc    Update user status with full moderation support
// @route   PATCH /api/admin/users/:id/status
// @access  Private/Admin
const updateUserStatus = asyncHandler(async (req, res) => {
  try {
    const { status, reason, suspensionDays = 7 } = req.body;
    const userId = req.params.id;

    if (!["active", "suspended", "banned", "inactive"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Trạng thái không hợp lệ",
      });
    }

    const userToUpdate = await User.findById(userId);
    if (!userToUpdate) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy user",
      });
    }

    // Prevent admin from banning/suspending another admin
    if (
      userToUpdate.role === "admin" &&
      userToUpdate._id.toString() !== req.user._id.toString()
    ) {
      // You might allow self-update, but not other admins
      return res.status(403).json({
        success: false,
        message: "Không thể thay đổi trạng thái của Admin khác.",
      });
    }

    const updateData = {
      status,
      // Reset all suspension/ban details when status changes
      suspensionExpires: null,
      suspensionReason: null,
      suspendedAt: null,
      suspendedBy: null,
      banReason: null,
      bannedAt: null,
      bannedBy: null,
    };
    let logActionType = "user_status_changed"; // Fallback
    let logReason = `Status changed to ${status}. Reason: ${
      reason || "Không có lý do"
    }`;

    if (status === "suspended") {
      const suspensionEndDate = new Date();
      suspensionEndDate.setDate(
        suspensionEndDate.getDate() + parseInt(suspensionDays, 10)
      );
      updateData.suspensionExpires = suspensionEndDate;
      updateData.suspensionReason = reason;
      logActionType = "user_suspended";
      logReason = `User suspended for ${suspensionDays} days. Reason: ${
        reason || "Không có lý do"
      }`;
      updateData.suspendedAt = new Date();
      updateData.suspendedBy = req.user._id;
    } else if (status === "banned") {
      updateData.banReason = reason;
      logActionType = "user_banned";
      logReason = `User banned. Reason: ${reason || "Không có lý do"}`;
      updateData.bannedAt = new Date();
      updateData.bannedBy = req.user._id;
    } else if (status === "active") {
      logActionType = "user_activated";
      logReason = `User activated. Reason: ${reason || "Manual activation"}`;
    } else if (status === "inactive") {
      logActionType = "user_deactivated";
      logReason = `User deactivated. Reason: ${
        reason || "Manual deactivation"
      }`;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    // Log the action
    await ForumAdminLog.logAction({
      admin: req.user._id,
      action: logActionType,
      targetType: "user",
      targetId: updatedUser._id,
      reason: logReason,
      metadata: { username: updatedUser.username, newStatus: status },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: `Đã cập nhật trạng thái user thành công`,
      data: updatedUser,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi server khi cập nhật trạng thái",
      error: error.message,
    });
  }
});

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
  try {
    const userId = req.params.id;

    // Prevent deleting self
    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "Không thể xóa chính mình",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy user",
      });
    }

    // Log the action BEFORE deleting
    await ForumAdminLog.logAction({
      admin: req.user._id,
      action: "user_deleted",
      targetType: "user",
      targetId: user._id,
      reason: `Deleted user: ${user.username} (ID: ${user._id})`,
      metadata: { username: user.username },
      ipAddress: req.ip,
    });

    await user.deleteOne(); // Use deleteOne to trigger middleware if any

    res.json({
      success: true,
      message: "Đã xóa user và các nội dung liên quan thành công",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi server khi xóa user",
      error: error.message,
    });
  }
});

// @desc    Create first admin (public endpoint)
// @route   POST /api/admin/create-first-admin
// @access  Public (but protected by business logic)
const createFirstAdmin = asyncHandler(async (req, res) => {
  try {
    // Check if any admin exists
    const existingAdmin = await User.findOne({ role: "admin" });

    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: "Admin đã tồn tại trong hệ thống",
      });
    }

    const { username, email, password, displayName } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Username, email và password là bắt buộc",
      });
    }

    // Create first admin
    const admin = await User.create({
      username,
      email,
      password,
      displayName: displayName || username,
      role: "admin",
      isEmailVerified: true, // Admin không cần xác nhận email
    });

    res.status(201).json({
      success: true,
      message: "Đã tạo admin đầu tiên thành công!",
      data: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi server khi tạo admin",
      error: error.message,
    });
  }
});

// @desc    Toggle user's auto-approval status
// @route   PATCH /api/admin/users/:id/toggle-auto-approval
// @access  Private/Admin
const toggleAutoApproval = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy user",
      });
    }

    user.autoApprovalEnabled = !user.autoApprovalEnabled;
    await user.save();

    // Log the action
    await ForumAdminLog.logAction({
      admin: req.user._id,
      action: "user_updated",
      targetType: "user",
      targetId: user._id,
      reason: `Toggled auto-approval to ${user.autoApprovalEnabled}`,
      metadata: {
        username: user.username,
        autoApproval: user.autoApprovalEnabled,
      },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: `Đã cập nhật trạng thái tự động duyệt cho ${user.username}`,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi server khi cập nhật",
      error: error.message,
    });
  }
});

// @desc    Update user trust level
// @route   PATCH /api/admin/users/:id/trust-level
// @access  Private/Admin
const updateUserTrustLevel = asyncHandler(async (req, res) => {
  try {
    const { trustLevel } = req.body;
    const userId = req.params.id;

    const allowedLevels = ["new", "basic", "trusted", "moderator"];
    if (!allowedLevels.includes(trustLevel)) {
      return res.status(400).json({
        success: false,
        message: "Cấp độ tin cậy không hợp lệ.",
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { trustLevel },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy user",
      });
    }

    // Log the action
    await ForumAdminLog.logAction({
      admin: req.user._id,
      action: "user_trust_level_changed",
      targetType: "user",
      targetId: user._id,
      reason: `Changed trust level to ${trustLevel}`,
      metadata: { username: user.username },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: `Đã cập nhật độ tin cậy thành ${trustLevel}`,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi server khi cập nhật độ tin cậy",
      error: error.message,
    });
  }
});

export {
  getDashboardStats,
  getAllUsers,
  updateUserRole,
  updateUserStatus,
  deleteUser,
  createFirstAdmin,
  toggleAutoApproval,
  updateUserTrustLevel,
};
