import express from "express";
import {
  getContinueWatching,
  deleteWatchSession,
  reportWatchEvent,
} from "../controllers/watchSession.controller.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Tất cả các route trong file này đều yêu cầu xác thực
router.use(protect);

// @desc    Get user's continue watching list
// @route   GET /api/continue-watching
// @access  Private
router.get("/", getContinueWatching);

// @desc    Report a watch event
// @route   POST /api/continue-watching/report
// @access  Private
router.post("/report", reportWatchEvent);

// @desc    Delete a watch session from history
// @route   DELETE /api/continue-watching/:id
// @access  Private
router.delete("/:id", deleteWatchSession);

export default router;
