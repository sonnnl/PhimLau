import express from "express";
import {
  createOrUpdateReview,
  getReviewsForMovie,
  deleteReview,
} from "../controllers/reviewController.js";
import { protect } from "../middleware/authMiddleware.js"; // Middleware xác thực người dùng

const router = express.Router();

// Route để lấy review của một phim (movieId là _id của MovieMetadata)
router.route("/:movieId").get(getReviewsForMovie);

// Route để tạo hoặc cập nhật review cho một phim
router.route("/:movieId").post(protect, createOrUpdateReview);

// Route để xóa một review cụ thể bằng reviewId
router.route("/:reviewId").delete(protect, deleteReview);

export default router;
