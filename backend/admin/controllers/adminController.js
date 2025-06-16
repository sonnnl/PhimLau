import asyncHandler from "express-async-handler";
import User from "../../models/UserModel.js";
import Review from "../../models/ReviewModel.js";
import ForumThread from "../../models/ForumThread.js";
import ForumReply from "../../models/ForumReply.js";

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
        message: "Status không hợp lệ",
      });
    }

    // Prevent admin from changing their own status
    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "Không thể thay đổi trạng thái của chính mình",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy user",
      });
    }

    // Build update data based on status
    let updateData = { status };

    if (status === "suspended") {
      updateData = {
        ...updateData,
        suspendedBy: req.user._id,
        suspendedAt: new Date(),
        suspensionReason: reason || "Tạm khóa bởi admin",
        suspensionExpires: new Date(
          Date.now() + suspensionDays * 24 * 60 * 60 * 1000
        ),
      };

      // Create notification
      try {
        const { default: Notification } = await import(
          "../../models/NotificationModel.js"
        );
        await Notification.create({
          user: userId,
          type: "account_suspended",
          title: "Tài khoản bị tạm khóa",
          message: `Tài khoản của bạn đã bị tạm khóa ${suspensionDays} ngày. Lý do: ${
            reason || "Không có lý do cụ thể"
          }`,
          data: {
            moderatorId: req.user._id,
            reason: reason,
            suspensionDays: suspensionDays,
            severity: "suspension",
          },
          priority: "urgent",
        });
      } catch (notifError) {
        console.error("Error creating suspension notification:", notifError);
      }
    } else if (status === "banned") {
      updateData = {
        ...updateData,
        bannedBy: req.user._id,
        bannedAt: new Date(),
        banReason: reason || "Cấm bởi admin",
        // Clear suspension fields if any
        suspendedBy: undefined,
        suspendedAt: undefined,
        suspensionReason: undefined,
        suspensionExpires: undefined,
      };

      // Create notification
      try {
        const { default: Notification } = await import(
          "../../models/NotificationModel.js"
        );
        await Notification.create({
          user: userId,
          type: "account_banned",
          title: "Tài khoản bị cấm vĩnh viễn",
          message: `Tài khoản của bạn đã bị cấm vĩnh viễn. Lý do: ${
            reason || "Không có lý do cụ thể"
          }`,
          data: {
            moderatorId: req.user._id,
            reason: reason,
            severity: "ban",
          },
          priority: "urgent",
        });
      } catch (notifError) {
        console.error("Error creating ban notification:", notifError);
      }
    } else if (status === "active") {
      // Clear all moderation fields when activating
      updateData = {
        ...updateData,
        suspendedBy: undefined,
        suspendedAt: undefined,
        suspensionReason: undefined,
        suspensionExpires: undefined,
        bannedBy: undefined,
        bannedAt: undefined,
        banReason: undefined,
      };
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    const statusMessages = {
      active: "kích hoạt",
      suspended: `tạm khóa ${suspensionDays} ngày`,
      banned: "cấm vĩnh viễn",
      inactive: "vô hiệu hóa",
    };

    res.json({
      success: true,
      message: `Đã ${statusMessages[status]} tài khoản`,
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

    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy user",
      });
    }

    res.json({
      success: true,
      message: "Đã xóa user thành công",
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

export {
  getDashboardStats,
  getAllUsers,
  updateUserRole,
  updateUserStatus,
  deleteUser,
  createFirstAdmin,
};
