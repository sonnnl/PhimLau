import express from "express";
const router = express.Router();

// Import các controller đã được chuyển sang ESM
import {
  getLatestMovies,
  getMovieDetailsBySlug,
  searchMovies,
  getSingleMovies,
  getSeriesMovies,
} from "../controllers/movieController.js"; // Thêm .js extension nếu cần

// @route   GET /api/movies/latest
// @desc    Lấy danh sách phim mới cập nhật
// @access  Public
router.get("/latest", getLatestMovies);

// @route   GET /api/movies/single
// @desc    Lấy danh sách phim lẻ
// @access  Public
router.get("/single", getSingleMovies);

// @route   GET /api/movies/series
// @desc    Lấy danh sách phim bộ
// @access  Public
router.get("/series", getSeriesMovies);

// @route   GET /api/movies/details/:slug
// @desc    Lấy chi tiết phim bằng slug
// @access  Public
router.get("/details/:slug", getMovieDetailsBySlug);

// @route   GET /api/movies/search
// @desc    Tìm kiếm phim theo từ khóa
// @access  Public
router.get("/search", searchMovies);

export default router;
