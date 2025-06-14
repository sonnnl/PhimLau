import express from "express";
const router = express.Router();
import {
  getCategories,
  createCategory,
  getForumThreadsWithPagination, // ✅ Updated import name
  getThreadBySlug,
  createThread,
  createReply,
} from "../controllers/forumController.js";
import { protect } from "../middleware/authMiddleware.js"; // Import middleware bảo vệ

// === Category Routes ===
router
  .route("/categories")
  .get(getCategories) // Lấy danh sách categories
  .post(protect, createCategory); // Tạo category mới (cần protect, và sau này thêm check admin)

// === Thread Routes ===
router
  .route("/threads")
  .get(getForumThreadsWithPagination) // Lấy danh sách threads với pagination & filter
  .post(protect, createThread); // Tạo thread mới (cần protect)

router.route("/threads/:slug").get(getThreadBySlug); // Lấy chi tiết thread bằng slug

// === Reply Routes ===
// Đặt route reply lồng dưới thread sử dụng threadId để dễ lấy context
router
  .route("/threads/:threadId/replies")
  // GET replies cho một thread có thể được xử lý bên trong getThreadBySlug (lấy kèm replies)
  // hoặc tạo route riêng nếu cần GET replies độc lập với phân trang riêng.
  .post(protect, createReply); // Tạo reply mới cho thread (cần protect)

export default router;
