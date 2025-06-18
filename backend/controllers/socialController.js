import asyncHandler from "express-async-handler";
import User from "../models/UserModel.js";
import ForumThread from "../models/ForumThread.js";
import ForumReply from "../models/ForumReply.js";
import Review from "../models/ReviewModel.js";
import Like from "../models/LikeModel.js";

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
      "username displayName avatarUrl role createdAt trustLevel"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }

    // Get user statistics
    const [
      totalThreads,
      totalReplies,
      totalReviews,
      averageRating,
      userThreads,
      userReplies,
    ] = await Promise.all([
      ForumThread.countDocuments({ author: userId }),
      ForumReply.countDocuments({ author: userId }),
      Review.countDocuments({ user: userId }),
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

    // Get recent activities
    const [recentThreads, recentReviews] = await Promise.all([
      ForumThread.find({ author: userId })
        .populate("category", "name slug")
        .sort({ createdAt: -1 })
        .limit(5),
      Review.find({ user: userId })
        .populate("movie", "name slug posterUrl")
        .sort({ createdAt: -1 })
        .limit(10), // Get more to filter out deleted movies
    ]);

    // Filter out reviews where movie is null (deleted movies)
    const validRecentReviews = recentReviews
      .filter((review) => review.movie)
      .slice(0, 5);

    const stats = {
      totalThreads: totalThreads || 0,
      totalReplies: totalReplies || 0,
      totalReviews: totalReviews || 0,
      averageRating: averageRating.length > 0 ? averageRating[0].avgRating : 0,
      totalLikes: totalLikes || 0,
    };

    res.json({
      success: true,
      data: {
        user,
        stats,
        recentThreads,
        recentReviews: validRecentReviews,
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
