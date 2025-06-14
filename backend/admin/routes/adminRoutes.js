import express from "express";
import {
  getDashboardStats,
  getAllUsers,
  updateUserRole,
  deleteUser,
  createFirstAdmin,
} from "../controllers/adminController.js";
import {
  sendNotification,
  getNotificationStats,
  getAllNotifications,
} from "../controllers/notificationController.js";
import { protect, admin } from "../../middleware/authMiddleware.js";

const router = express.Router();

// Public route for creating first admin
router.post("/create-first-admin", createFirstAdmin);

// All other routes require authentication
router.use(protect);
router.use(admin); // All routes below require admin role

// Dashboard & Statistics
router.get("/stats", getDashboardStats);

// User Management
router.get("/users", getAllUsers);
router.patch("/users/:id/role", updateUserRole);
router.delete("/users/:id", deleteUser);

// Notification Management
router.post("/notifications/send", sendNotification);
router.get("/notifications/stats", getNotificationStats);
router.get("/notifications", getAllNotifications);

export default router;
