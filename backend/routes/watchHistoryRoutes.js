import express from "express";
import {
  getWatchHistory,
  deleteWatchSession,
  reportWatchEvent,
} from "../controllers/watchHistoryController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Tất cả các route trong file này đều yêu cầu xác thực
router.use(protect);

// @desc    Get user's watch history
// @route   GET /api/watch-history
// @access  Private
router.get("/", getWatchHistory);

// @desc    Report a watch event
// @route   POST /api/watch-history/report
// @access  Private
router.post("/report", reportWatchEvent);

// @desc    Delete a watch session from history
// @route   DELETE /api/watch-history/:id
// @access  Private
router.delete("/:id", deleteWatchSession);

export default router;
