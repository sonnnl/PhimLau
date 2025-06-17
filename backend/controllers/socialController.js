import asyncHandler from "express-async-handler";
import User from "../models/UserModel.js";
import ForumThread from "../models/ForumThread.js";
import ForumReply from "../models/ForumReply.js";

// @desc    Get public user profile with stats and recent activities
// @route   GET /api/social/profile/:userId
// @access  Public
export const getPublicProfile = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate if userId is a valid MongoDB ObjectId
    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "ID người dùng không hợp lệ",
      });
    }

    // Get user basic info - select only public fields
    const user = await User.findById(userId).select(
      "displayName avatarUrl role createdAt"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }

    // Get user statistics
    const [totalThreads, totalReplies] = await Promise.all([
      ForumThread.countDocuments({ author: userId }),
      ForumReply.countDocuments({ author: userId }),
    ]);

    // Get recent forum threads (last 10)
    const recentThreads = await ForumThread.find({ author: userId })
      .populate("category", "name slug")
      .sort({ createdAt: -1 })
      .limit(10);

    const stats = {
      totalThreads: totalThreads || 0,
      totalReplies: totalReplies || 0,
    };

    res.json({
      success: true,
      data: {
        user,
        stats,
        recentThreads,
      },
    });
  } catch (error) {
    console.error("Get public profile error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy thông tin profile công khai",
    });
  }
});
