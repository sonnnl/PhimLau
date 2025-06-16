import express from "express";
import {
  getUserNotifications,
  markAsRead,
  markAsClicked,
  markAllAsRead,
  deleteNotification,
  getNotificationStats,
} from "../controllers/notificationController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// @route   GET /api/notifications
// @desc    Get user notifications with pagination and filters
// @access  Private
router.get("/", getUserNotifications);

// @route   GET /api/notifications/stats
// @desc    Get notification statistics
// @access  Private
router.get("/stats", getNotificationStats);

// @route   PUT /api/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.put("/read-all", markAllAsRead);

// @route   PUT /api/notifications/:id/read
// @desc    Mark specific notification as read
// @access  Private
router.put("/:id/read", markAsRead);

// @route   PUT /api/notifications/:id/click
// @desc    Mark specific notification as clicked
// @access  Private
router.put("/:id/click", markAsClicked);

// @route   DELETE /api/notifications/:id
// @desc    Delete specific notification
// @access  Private
router.delete("/:id", deleteNotification);

export default router;
