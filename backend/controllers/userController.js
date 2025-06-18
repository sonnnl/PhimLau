import asyncHandler from "express-async-handler";
import User from "../models/UserModel.js";
import Review from "../models/ReviewModel.js";
import ForumThread from "../models/ForumThread.js";
import ForumReply from "../models/ForumReply.js";
import Like from "../models/LikeModel.js";
import bcrypt from "bcryptjs";
import { cloudinary } from "../config/cloudinary.js";

// @desc    Get user profile with stats and recent activities
// @route   GET /api/user/profile
// @access  Private
export const getUserProfile = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;

    // Get user basic info
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }

    // Get user statistics
    const [
      totalReviews,
      totalThreads,
      totalReplies,
      reviews,
      averageRating,
      userThreads,
      userReplies,
    ] = await Promise.all([
      Review.countDocuments({ user: userId }),
      ForumThread.countDocuments({ author: userId }),
      ForumReply.countDocuments({ author: userId }),
      Review.find({ user: userId }).select("rating"),
      Review.aggregate([
        { $match: { user: userId } },
        { $group: { _id: null, avgRating: { $avg: "$rating" } } },
      ]),
      ForumThread.find({ author: userId }).select("_id"),
      ForumReply.find({ author: userId }).select("_id"),
    ]);

    const threadIds = userThreads.map((t) => t._id);
    const replyIds = userReplies.map((r) => r._id);

    const totalLikes = await Like.countDocuments({
      $or: [
        { targetType: "thread", targetId: { $in: threadIds } },
        { targetType: "reply", targetId: { $in: replyIds } },
      ],
    });

    // Get recent reviews (last 5) - filter out reviews with deleted movies
    const recentReviews = await Review.find({ user: userId })
      .populate("movie", "name slug posterUrl")
      .sort({ createdAt: -1 })
      .limit(10); // Get more to filter out deleted movies

    // Filter out reviews where movie is null (deleted movies)
    const validRecentReviews = recentReviews
      .filter((review) => review.movie)
      .slice(0, 5);

    // Get recent forum threads (last 5)
    const recentThreads = await ForumThread.find({ author: userId })
      .sort({ createdAt: -1 })
      .limit(5);

    const stats = {
      totalReviews: totalReviews || 0,
      totalThreads: totalThreads || 0,
      totalReplies: totalReplies || 0,
      averageRating: averageRating.length > 0 ? averageRating[0].avgRating : 0,
      totalLikes: totalLikes || 0,
    };

    res.json({
      success: true,
      user,
      stats,
      recentReviews: validRecentReviews,
      recentThreads,
    });
  } catch (error) {
    console.error("Get user profile error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy thông tin profile",
    });
  }
});

// @desc    Update user profile
// @route   PUT /api/user/profile
// @access  Private
export const updateUserProfile = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    const { displayName, email, avatarUrl } = req.body;

    // Check if email is already taken by another user
    if (email && email !== req.user.email) {
      const existingUser = await User.findOne({
        email: email,
        _id: { $ne: userId },
      });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Email này đã được sử dụng",
        });
      }
    }

    // Update user profile
    const updateData = {};
    if (displayName !== undefined) updateData.displayName = displayName;
    if (email !== undefined) updateData.email = email;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;

    // Đánh dấu user đã tùy chỉnh profile để tránh ghi đè khi đăng nhập Google
    updateData.hasCustomizedProfile = true;

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    res.json({
      success: true,
      message: "Cập nhật thông tin thành công",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update user profile error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi cập nhật profile",
    });
  }
});

// @desc    Update user password
// @route   PUT /api/user/password
// @access  Private
export const updateUserPassword = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp mật khẩu hiện tại và mật khẩu mới",
      });
    }

    // Get user with password
    const user = await User.findById(userId).select("+password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }

    // Check if user has password (Google accounts might not have password)
    if (!user.password) {
      return res.status(400).json({
        success: false,
        message: "Tài khoản này không có mật khẩu. Vui lòng liên hệ admin.",
      });
    }

    // Verify current password
    const isCurrentPasswordCorrect = await user.matchPassword(currentPassword);
    if (!isCurrentPasswordCorrect) {
      return res.status(400).json({
        success: false,
        message: "Mật khẩu hiện tại không đúng",
      });
    }

    // Validate new password
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Mật khẩu mới phải có ít nhất 6 ký tự",
      });
    }

    // Hash and update new password
    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    await User.findByIdAndUpdate(userId, {
      password: hashedNewPassword,
    });

    res.json({
      success: true,
      message: "Đổi mật khẩu thành công",
    });
  } catch (error) {
    console.error("Update password error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi đổi mật khẩu",
    });
  }
});

// @desc    Get user statistics
// @route   GET /api/user/stats
// @access  Private
export const getUserStats = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;

    const [totalReviews, totalThreads, totalReplies, averageRating] =
      await Promise.all([
        Review.countDocuments({ user: userId }),
        ForumThread.countDocuments({ author: userId }),
        ForumReply.countDocuments({ author: userId }),
        Review.aggregate([
          { $match: { user: userId } },
          { $group: { _id: null, avgRating: { $avg: "$rating" } } },
        ]),
      ]);

    const stats = {
      totalReviews: totalReviews || 0,
      totalThreads: totalThreads || 0,
      totalReplies: totalReplies || 0,
      averageRating: averageRating.length > 0 ? averageRating[0].avgRating : 0,
    };

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("Get user stats error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy thống kê",
    });
  }
});

// @desc    Get user reviews with pagination
// @route   GET /api/user/reviews
// @access  Private
export const getUserReviews = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const allReviews = await Review.find({ user: userId })
      .populate("movie", "name slug posterUrl")
      .sort({ createdAt: -1 });

    // Filter out reviews with deleted movies
    const validReviews = allReviews.filter((review) => review.movie);

    // Apply pagination to valid reviews
    const reviews = validReviews.slice(skip, skip + limit);
    const total = validReviews.length;

    res.json({
      success: true,
      data: {
        reviews,
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
    console.error("Get user reviews error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách đánh giá",
    });
  }
});

// @desc    Get user forum threads with pagination and filters
// @route   GET /api/user/threads?status=pending&category=slug&page=1&limit=10
// @access  Private
export const getUserThreads = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // 🔍 BUILD FILTER QUERY
    let filter = { author: userId };

    // Filter by moderation status
    if (req.query.status) {
      filter.moderationStatus = req.query.status;
    }

    // Filter by category
    if (req.query.category) {
      const ForumCategory = await import("../models/ForumCategory.js").then(
        (m) => m.default
      );
      const category = await ForumCategory.findOne({
        slug: req.query.category,
      });
      if (category) {
        filter.category = category._id;
      }
    }

    // 📊 GET THREADS WITH ENHANCED DATA
    const threads = await ForumThread.find(filter)
      .populate("category", "name slug color")
      .select(
        "title slug content moderationStatus moderationNote isDeleted createdAt updatedAt replyCount views isLocked isPinned category"
      )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await ForumThread.countDocuments(filter);

    // 📈 GET STATUS COUNTS FOR UI
    const statusCounts = await ForumThread.aggregate([
      { $match: { author: userId } },
      { $group: { _id: "$moderationStatus", count: { $sum: 1 } } },
    ]);

    const statusStats = {
      pending: statusCounts.find((s) => s._id === "pending")?.count || 0,
      approved: statusCounts.find((s) => s._id === "approved")?.count || 0,
      rejected: statusCounts.find((s) => s._id === "rejected")?.count || 0,
      total: statusCounts.reduce((sum, s) => sum + s.count, 0),
    };

    res.json({
      success: true,
      data: {
        threads,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        },
        statusStats, // ✅ Thêm thống kê trạng thái
        currentFilter: {
          status: req.query.status || "all",
          category: req.query.category || "all",
        },
      },
    });
  } catch (error) {
    console.error("Get user threads error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách bài viết forum",
    });
  }
});

// @desc    Upload user avatar
// @route   POST /api/user/avatar
// @access  Private
export const uploadAvatar = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng chọn file ảnh để upload",
      });
    }

    console.log("📁 File uploaded:", req.file);

    // Get current user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }

    // Convert buffer to base64 for Cloudinary upload
    const base64File = `data:${
      req.file.mimetype
    };base64,${req.file.buffer.toString("base64")}`;

    // Upload to Cloudinary with minimal options to avoid signature issues
    const result = await cloudinary.uploader.upload(base64File, {
      resource_type: "image",
    });

    console.log("☁️ Cloudinary result:", result.secure_url);

    // Update user with new avatar URL
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        avatarUrl: result.secure_url,
        hasCustomizedProfile: true, // Đánh dấu đã tùy chỉnh
      },
      { new: true, runValidators: true }
    ).select("-password");

    console.log("✅ Avatar updated:", result.secure_url);

    res.json({
      success: true,
      message: "Cập nhật avatar thành công",
      user: updatedUser,
      avatarUrl: result.secure_url,
    });
  } catch (error) {
    console.error("❌ Upload avatar error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi upload avatar: " + error.message,
    });
  }
});
