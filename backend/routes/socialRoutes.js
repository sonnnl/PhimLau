import express from "express";
import { getPublicProfile } from "../controllers/socialController.js";

const router = express.Router();

// @desc    Get public user profile
// @route   GET /api/social/profile/:userId
// @access  Public
router.get("/profile/:userId", getPublicProfile);

export default router;
