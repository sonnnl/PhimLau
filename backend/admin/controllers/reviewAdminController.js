import asyncHandler from "express-async-handler";
import Review from "../../models/ReviewModel.js";
import MovieMetadata from "../../models/MovieMetadataModel.js";
import User from "../../models/UserModel.js";
import ForumAdminLog from "../../models/ForumAdminLog.js";

// @desc    Get all reviews (admin)
// @route   GET /api/admin/reviews
// @access  Private/Admin
const getAllReviews = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, sort = "-createdAt", search } = req.query;

  // Build query object
  const query = {};
  if (search) {
    // Case-insensitive search on the review content
    query.content = { $regex: search, $options: "i" };
  }

  // Convert page and limit to numbers
  const limitValue = parseInt(limit, 10);
  const pageValue = parseInt(page, 10);
  const skipValue = (pageValue - 1) * limitValue;

  // Get total number of documents matching the query for pagination
  const totalReviews = await Review.countDocuments(query);

  // Find reviews with sorting, pagination and population
  const reviews = await Review.find(query)
    .populate({
      path: "user",
      select: "username avatarUrl",
    })
    .populate({
      path: "movie",
      model: MovieMetadata,
      foreignField: "_id",
      localField: "movie",
      select: "name posterUrl slug _id",
    })
    .sort(sort)
    .skip(skipValue)
    .limit(limitValue);

  res.status(200).json({
    message: "Reviews fetched successfully",
    totalReviews,
    totalPages: Math.ceil(totalReviews / limitValue),
    currentPage: pageValue,
    reviews,
  });
});

// @desc    Get a single review by ID (admin)
// @route   GET /api/admin/reviews/:id
// @access  Private/Admin
const getReviewById = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id)
    .populate("user", "username email profile")
    .populate({
      path: "movie",
      model: MovieMetadata,
      foreignField: "_id",
      localField: "movie",
      select: "name posterUrl slug _id",
    });

  if (!review) {
    res.status(404);
    throw new Error("Review not found");
  }

  res.status(200).json(review);
});

// @desc    Delete a review (admin)
// @route   DELETE /api/admin/reviews/:id
// @access  Private/Admin
const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id).populate({
    path: "movie",
    select: "slug",
  });

  if (!review) {
    res.status(404);
    throw new Error("Review not found");
  }

  // This will trigger the 'findOneAndDelete' middleware in ReviewModel
  // to recalculate the average rating.
  await Review.findByIdAndDelete(req.params.id);

  // Log the action
  await ForumAdminLog.logAction({
    admin: req.user._id,
    action: "review_deleted",
    targetType: "review",
    targetId: review._id,
    reason: `Deleted review: "${review.content.substring(0, 50)}..."`,
    metadata: { movieSlug: review.movie?.slug },
    ipAddress: req.ip,
  });

  // Logic to delete replies has been removed as it's no longer needed
  // await Review.deleteMany({ parentReview: req.params.id });

  res.status(200).json({ message: "Review deleted successfully" });
});

// @desc    Update a review content (admin moderation)
// @route   PUT /api/admin/reviews/:id
// @access  Private/Admin
const updateReview = asyncHandler(async (req, res) => {
  const { content } = req.body;

  const review = await Review.findById(req.params.id).populate({
    path: "movie",
    select: "slug",
  });

  if (!review) {
    res.status(404);
    throw new Error("Review not found");
  }

  const oldContent = review.content;
  review.content = content || review.content;

  const updatedReview = await review.save();

  // Log the action
  await ForumAdminLog.logAction({
    admin: req.user._id,
    action: "review_updated",
    targetType: "review",
    targetId: review._id,
    beforeData: { content: oldContent },
    afterData: { content: updatedReview.content },
    reason: `Updated review content`,
    metadata: { movieSlug: review.movie?.slug },
    ipAddress: req.ip,
  });

  res.status(200).json(updatedReview);
});

export { getAllReviews, getReviewById, deleteReview, updateReview };
