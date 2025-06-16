import express from "express";
import {
  getUserProfile,
  updateUserProfile,
  updateUserPassword,
  getUserStats,
  getUserReviews,
  getUserThreads,
  uploadAvatar,
} from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";
import { upload } from "../config/cloudinary.js";

const router = express.Router();

// All routes are protected - require authentication
router.use(protect);

// @desc    Get user profile with stats and recent activities
// @route   GET /api/user/profile
// @access  Private
router.get("/profile", getUserProfile);

// @desc    Update user profile
// @route   PUT /api/user/profile
// @access  Private
router.put("/profile", updateUserProfile);

// @desc    Update user password
// @route   PUT /api/user/password
// @access  Private
router.put("/password", updateUserPassword);

// @desc    Get user statistics
// @route   GET /api/user/stats
// @access  Private
router.get("/stats", getUserStats);

// @desc    Get user reviews with pagination
// @route   GET /api/user/reviews
// @access  Private
router.get("/reviews", getUserReviews);

// @desc    Get user forum threads with pagination
// @route   GET /api/user/threads
// @access  Private
router.get("/threads", getUserThreads);

// @desc    Upload user avatar
// @route   POST /api/user/avatar
// @access  Private
router.post("/avatar", upload.single("avatar"), uploadAvatar);

export default router;
