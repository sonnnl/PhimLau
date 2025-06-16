import express from "express";
const router = express.Router();
import {
  getForumCategories,
  createCategory,
  getForumThreadsWithPagination, // ✅ Updated import name
  getThreadBySlug,
  createThread,
  createReply,
  createReport, // ✅ Import createReport
  getThreadsByMovie, // ✅ Import movie threads
  getTrendingMovieDiscussions, // ✅ Import trending movies
  searchMoviesForThread, // ✅ Import search movies
  deleteThread, // ✅ Import deleteThread
  deleteReply, // ✅ Import deleteReply
} from "../controllers/forumController.js";
import { protect } from "../middleware/authMiddleware.js"; // Import middleware bảo vệ
import {
  cacheCategories,
  cacheThreadList,
  cacheMovieSearch,
  invalidateCache,
} from "../middleware/cacheMiddleware.js";

// === Category Routes ===
router
  .route("/categories")
  .get(cacheCategories, getForumCategories) // 🚀 Chỉ server cache, không HTTP cache
  .post(protect, invalidateCache(["categories", "statistics"]), createCategory); // 🗑️ Invalidate cache after create

// === Thread Routes ===
router
  .route("/threads")
  .get(cacheThreadList, getForumThreadsWithPagination) // 🚀 Chỉ server cache
  .post(
    protect,
    invalidateCache(["threadList", "statistics", "categories"]),
    createThread
  ); // 🗑️ Invalidate after create

router
  .route("/threads/:threadId")
  .delete(
    protect,
    invalidateCache(["threadList", "statistics", "categories"]),
    deleteThread
  );

// Route để xem thread detail
router.route("/threads/:slug").get(getThreadBySlug); // Lấy chi tiết thread bằng slug

// === Reply Routes ===
router
  .route("/replies/:replyId")
  .delete(protect, invalidateCache(["threadList", "statistics"]), deleteReply);

// Đặt route reply lồng dưới thread sử dụng threadId để dễ lấy context
router
  .route("/threads/:threadId/replies")
  // GET replies cho một thread có thể được xử lý bên trong getThreadBySlug (lấy kèm replies)
  // hoặc tạo route riêng nếu cần GET replies độc lập với phân trang riêng.
  .post(protect, invalidateCache(["threadList", "statistics"]), createReply); // Tạo reply mới cho thread (cần protect)

// === 🚨 Report Routes ===
router.route("/reports").post(protect, createReport); // Tạo báo cáo nội dung vi phạm (cần đăng nhập)

// === 🎬 Movie Discussion Routes ===
router.route("/threads/movie/:movieId").get(getThreadsByMovie); // Lấy threads theo movieId

router.route("/movie-discussions/trending").get(getTrendingMovieDiscussions); // Lấy phim discussion trending

// ===== 🎬 MOVIE SEARCH ROUTE với CACHE =====
router.get("/search/movies", cacheMovieSearch, searchMoviesForThread); // 🚀 Chỉ server cache

export default router;
