import express from "express";
import {
  toggleLike,
  getLikeStatus,
  getUserLikes,
  getLikeStats,
  getTopLikedItems,
} from "../controllers/likeController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// @route   POST /api/likes/toggle
// @desc    Toggle like for thread or reply
// @access  Private
router.post("/toggle", protect, toggleLike);

// @route   POST /api/likes/status
// @desc    Get like status for multiple items
// @access  Private
router.post("/status", protect, getLikeStatus);

// @route   GET /api/likes/my-likes
// @desc    Get user's liked items
// @access  Private
router.get("/my-likes", protect, getUserLikes);

// @route   POST /api/likes/stats
// @desc    Get like statistics for items
// @access  Public
router.post("/stats", getLikeStats);

// @route   GET /api/likes/top
// @desc    Get top liked items
// @access  Public
router.get("/top", getTopLikedItems);

export default router;
