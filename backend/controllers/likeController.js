import asyncHandler from "express-async-handler";
import Like from "../models/LikeModel.js";
import ForumThread from "../models/ForumThread.js";
import ForumReply from "../models/ForumReply.js";
import User from "../models/UserModel.js";
import {
  createThreadLikeNotification,
  createReplyLikeNotification,
} from "./notificationController.js";

// @desc    Toggle like for thread or reply
// @route   POST /api/likes/toggle
// @access  Private
export const toggleLike = asyncHandler(async (req, res) => {
  const { targetType, targetId } = req.body;
  const userId = req.user._id;

  // Validate input
  if (!targetType || !targetId) {
    res.status(400);
    throw new Error("targetType và targetId là bắt buộc");
  }

  if (!["thread", "reply"].includes(targetType)) {
    res.status(400);
    throw new Error("targetType phải là 'thread' hoặc 'reply'");
  }

  // Verify target exists
  let target;
  if (targetType === "thread") {
    target = await ForumThread.findById(targetId).populate("author");
    if (!target) {
      res.status(404);
      throw new Error("Không tìm thấy chủ đề");
    }
  } else if (targetType === "reply") {
    target = await ForumReply.findById(targetId)
      .populate("author")
      .populate("thread");
    if (!target) {
      res.status(404);
      throw new Error("Không tìm thấy phản hồi");
    }
  }

  // Lấy author ID từ target để cập nhật stats
  const authorId = target.author?._id ? target.author._id.toString() : null;

  // Toggle like
  const result = await Like.toggleLike(userId, targetType, targetId);

  // Cập nhật số lượt thích nhận được của tác giả một cách an toàn
  if (authorId) {
    if (result.liked) {
      // Khi người dùng thích, tăng count
      await User.findByIdAndUpdate(authorId, {
        $inc: { "forumStats.likesReceived": 1 },
      });
    } else {
      // Khi người dùng bỏ thích, chỉ giảm nếu count > 0
      await User.updateOne(
        { _id: authorId, "forumStats.likesReceived": { $gt: 0 } },
        { $inc: { "forumStats.likesReceived": -1 } }
      );
    }
  }

  // Update like count in target model
  const likeCount = await Like.countLikes(targetType, targetId);

  if (targetType === "thread") {
    await ForumThread.findByIdAndUpdate(targetId, { likeCount });

    // Create notification if liked (not unliked)
    if (result.liked) {
      await createThreadLikeNotification(userId, target);
    }
  } else if (targetType === "reply") {
    await ForumReply.findByIdAndUpdate(targetId, { likeCount });

    // Create notification if liked (not unliked)
    if (result.liked) {
      await createReplyLikeNotification(userId, target, target.thread);
    }
  }

  res.json({
    success: true,
    message: result.liked ? "Đã thích" : "Đã bỏ thích",
    data: {
      ...result,
      likeCount,
    },
  });
});

// @desc    Get like status for multiple items
// @route   POST /api/likes/status
// @access  Private
export const getLikeStatus = asyncHandler(async (req, res) => {
  const { items } = req.body; // [{ targetType, targetId }, ...]
  const userId = req.user._id;

  if (!Array.isArray(items) || items.length === 0) {
    res.status(400);
    throw new Error("items phải là array không rỗng");
  }

  const results = {};

  for (const item of items) {
    const { targetType, targetId } = item;

    if (!targetType || !targetId) continue;

    const key = `${targetType}_${targetId}`;

    // Check if user liked this item
    const isLiked = await Like.isLikedByUser(userId, targetType, targetId);

    // Get total like count
    const likeCount = await Like.countLikes(targetType, targetId);

    results[key] = {
      isLiked,
      likeCount,
    };
  }

  res.json({
    success: true,
    data: results,
  });
});

// @desc    Get user's liked items
// @route   GET /api/likes/my-likes
// @access  Private
export const getUserLikes = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const targetType = req.query.targetType; // optional filter

  const likes = await Like.getUserLikes(req.user._id, targetType, limit);

  res.json({
    success: true,
    data: likes,
    pagination: {
      currentPage: page,
      limit,
    },
  });
});

// @desc    Get like statistics for items
// @route   POST /api/likes/stats
// @access  Public
export const getLikeStats = asyncHandler(async (req, res) => {
  const { targetType, targetIds } = req.body;

  if (!targetType || !Array.isArray(targetIds)) {
    res.status(400);
    throw new Error("targetType và targetIds (array) là bắt buộc");
  }

  const stats = await Like.getLikeStats(targetType, targetIds);

  res.json({
    success: true,
    data: stats,
  });
});

// @desc    Get top liked items
// @route   GET /api/likes/top
// @access  Public
export const getTopLikedItems = asyncHandler(async (req, res) => {
  const targetType = req.query.targetType || "thread";
  const limit = parseInt(req.query.limit) || 10;
  const timeframe = req.query.timeframe || "all"; // all, week, month

  let dateFilter = {};
  if (timeframe === "week") {
    dateFilter = {
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    };
  } else if (timeframe === "month") {
    dateFilter = {
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    };
  }

  const pipeline = [
    { $match: { targetType, ...dateFilter } },
    {
      $group: {
        _id: "$targetId",
        likeCount: { $sum: 1 },
        latestLike: { $max: "$createdAt" },
      },
    },
    { $sort: { likeCount: -1, latestLike: -1 } },
    { $limit: limit },
  ];

  const results = await Like.aggregate(pipeline);

  // Populate the actual items
  const populatedResults = [];
  for (const result of results) {
    let item;
    if (targetType === "thread") {
      item = await ForumThread.findById(result._id)
        .populate("author", "username displayName avatarUrl")
        .populate("category", "name slug");
    } else if (targetType === "reply") {
      item = await ForumReply.findById(result._id)
        .populate("author", "username displayName avatarUrl")
        .populate("thread", "title slug");
    }

    if (item) {
      populatedResults.push({
        item,
        likeCount: result.likeCount,
        latestLike: result.latestLike,
      });
    }
  }

  res.json({
    success: true,
    data: populatedResults,
  });
});
