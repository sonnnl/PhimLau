import express from "express";
import { getRecommendedMovies } from "../controllers/recommendationController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// @route   GET /api/recommendations
// @desc    Get movie recommendations for the logged-in user
// @access  Private
router.get("/", protect, getRecommendedMovies);

export default router;
