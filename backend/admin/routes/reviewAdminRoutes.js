import express from "express";
import {
  getAllReviews,
  getReviewById,
  deleteReview,
  updateReview,
} from "../controllers/reviewAdminController.js";
import { protect, admin } from "../../middleware/authMiddleware.js";

const router = express.Router();

// All routes here are protected and for admins only
router.use(protect);
router.use(admin);

router.route("/").get(getAllReviews);

router.route("/:id").get(getReviewById).delete(deleteReview).put(updateReview);

export default router;
