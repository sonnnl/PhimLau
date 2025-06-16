import express from "express";
import {
  addFavorite,
  removeFavorite,
  getMyFavorites,
  checkFavoriteStatus,
} from "../controllers/favoriteController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Tất cả các route trong file này đều yêu cầu người dùng phải đăng nhập
router.use(protect);

// @route   POST /api/favorites/add
// @desc    Thêm một phim vào danh sách yêu thích
router.post("/add", addFavorite);

// @route   DELETE /api/favorites/remove
// @desc    Xóa một phim khỏi danh sách yêu thích
router.delete("/remove", removeFavorite);

// @route   GET /api/favorites/my-favorites
// @desc    Lấy danh sách phim yêu thích của người dùng
router.get("/my-favorites", getMyFavorites);

// @route   GET /api/favorites/status/:movieId
// @desc    Kiểm tra trạng thái yêu thích của một phim
router.get("/status/:movieId", checkFavoriteStatus);

export default router;
