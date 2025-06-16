import express from "express";
import {
  getAllNotifications,
  sendNotification,
  sendNotificationByRole,
  getNotificationStats,
  deleteNotification,
  bulkDeleteNotifications,
  getUsersForNotification,
} from "../controllers/adminNotificationController.js";
import { protect, admin } from "../../middleware/authMiddleware.js";

const router = express.Router();

// Apply authentication and admin middleware to all routes
router.use(protect);
router.use(admin);

// GET /api/admin/notifications - Get all notifications
router.get("/", getAllNotifications);

// GET /api/admin/notifications/stats - Get notification statistics
router.get("/stats", getNotificationStats);

// GET /api/admin/notifications/users - Get users for targeting
router.get("/users", getUsersForNotification);

// POST /api/admin/notifications/send - Send notification to specific users
router.post("/send", sendNotification);

// POST /api/admin/notifications/send-by-role - Send notification by role
router.post("/send-by-role", sendNotificationByRole);

// DELETE /api/admin/notifications/bulk - Bulk delete notifications
router.delete("/bulk", bulkDeleteNotifications);

// DELETE /api/admin/notifications/:id - Delete specific notification
router.delete("/:id", deleteNotification);

export default router;
