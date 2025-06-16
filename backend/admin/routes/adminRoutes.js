import express from "express";
import {
  getDashboardStats,
  getAllUsers,
  updateUserRole,
  updateUserStatus,
  deleteUser,
  createFirstAdmin,
} from "../controllers/adminController.js";
// Notification management moved to adminNotificationRoutes.js
import {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getAllThreads,
  moderateThread,
  toggleThreadLock,
  toggleThreadPin,
  deleteThread,
  getAllReplies,
  deleteReply,
  moderateReply,
  getAllReports,
  updateReport,
  bulkUpdateReports,
  getReportStats,
  resolveReport,
  getForumStats,
  resolveReportAndDeleteContent,
  resolveReportAndRequestEdit,
} from "../controllers/forumAdminController.js";
import { protect, admin } from "../../middleware/authMiddleware.js";
import { invalidateCache } from "../../middleware/cacheMiddleware.js";

const router = express.Router();

// Public route for creating first admin
router.post("/create-first-admin", createFirstAdmin);

// All other routes require authentication
router.use(protect);
router.use(admin); // All routes below require admin role

// Dashboard & Statistics - KHÔNG CACHE vì cần real-time
router.get("/stats", getDashboardStats);

// User Management - KHÔNG CACHE vì admin cần real-time data
router.get("/users", getAllUsers);
router.patch("/users/:id/role", updateUserRole);
router.patch("/users/:id/status", updateUserStatus);
router.delete("/users/:id", deleteUser);

// Notification Management - Moved to adminNotificationRoutes.js
// router.post("/notifications/send", sendNotification);
// router.get("/notifications/stats", getNotificationStats);
// router.get("/notifications", getAllNotifications);

// ==================== FORUM MANAGEMENT ====================

// Forum Statistics - KHÔNG CACHE vì admin cần thống kê real-time
router.get("/forum/stats", getForumStats);

// Category Management - GIỮ CACHE vì categories ít thay đổi
router
  .route("/forum/categories")
  .get(getAllCategories)
  .post(invalidateCache(["categories"]), createCategory);

router
  .route("/forum/categories/:id")
  .put(invalidateCache(["categories"]), updateCategory)
  .delete(invalidateCache(["categories"]), deleteCategory);

// Thread Management - KHÔNG CACHE vì admin cần thấy real-time threads
router.get("/forum/threads", getAllThreads);
router.patch(
  "/forum/threads/:id/moderate",
  invalidateCache(["threadList"]),
  moderateThread
);
router.patch(
  "/forum/threads/:id/lock",
  invalidateCache(["threadList"]),
  toggleThreadLock
);
router.patch(
  "/forum/threads/:id/pin",
  invalidateCache(["threadList"]),
  toggleThreadPin
);
router.delete(
  "/forum/threads/:id",
  invalidateCache(["threadList"]),
  deleteThread
);

// Reply Management - KHÔNG CACHE vì admin cần real-time
router.get("/forum/replies", getAllReplies);
router.patch(
  "/forum/replies/:id/moderate",
  invalidateCache(["threadList"]),
  moderateReply
);
router.delete(
  "/forum/replies/:id",
  invalidateCache(["threadList"]),
  deleteReply
);

// Report Management - KHÔNG CACHE vì reports cần real-time
router.get("/forum/reports", getAllReports);
router.get("/forum/reports/stats", getReportStats);
router.put("/forum/reports/:id", updateReport);
router.put("/forum/reports/bulk", bulkUpdateReports);
router.patch("/forum/reports/:id/resolve", resolveReport);

// New routes for specific report actions
router.post(
  "/forum/reports/:reportId/delete",
  invalidateCache(["threadList", "categories", "statistics"]),
  resolveReportAndDeleteContent
);
router.post(
  "/forum/reports/:reportId/request-edit",
  invalidateCache(["threadList"]),
  resolveReportAndRequestEdit
);

export default router;
