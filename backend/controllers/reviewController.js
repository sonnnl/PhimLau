import asyncHandler from "express-async-handler";
import Review from "../models/ReviewModel.js";
import MovieMetadata from "../models/MovieMetadataModel.js"; // Cần để kiểm tra phim tồn tại

// @desc    Create or update a review
// @route   POST /api/reviews/:movieId
// @access  Private
const createOrUpdateReview = asyncHandler(async (req, res) => {
  const { rating, content } = req.body;
  const { movieId } = req.params; // Đây là _id từ MovieMetadataModel
  const userId = req.user._id; // Từ middleware protect

  if (!content && !rating) {
    res.status(400);
    throw new Error("Cần có nội dung đánh giá hoặc số sao.");
  }
  if (rating && (rating < 1 || rating > 5)) {
    res.status(400);
    throw new Error("Số sao phải từ 1 đến 5.");
  }

  // Kiểm tra xem MovieMetadata có tồn tại không
  const movieExists = await MovieMetadata.findById(movieId);
  if (!movieExists) {
    res.status(404);
    throw new Error("Phim không tồn tại trong hệ thống.");
  }

  const review = await Review.findOneAndUpdate(
    { movie: movieId, user: userId },
    { movie: movieId, user: userId, rating, content },
    {
      new: true, // Trả về document mới sau khi cập nhật
      upsert: true, // Tạo mới nếu chưa tồn tại
      runValidators: true, // Chạy các validation của schema
    }
  );

  // Manually trigger rating calculation to ensure it's updated
  try {
    await Review.calculateAverageRating(movieId);
  } catch (error) {
    console.error("Error calculating average rating:", error);
  }

  res.status(201).json(review);
});

// @desc    Get reviews for a movie
// @route   GET /api/reviews/:movieId
// @access  Public
const getReviewsForMovie = asyncHandler(async (req, res) => {
  const { movieId } = req.params;
  const pageSize = 10;
  const page = Number(req.query.pageNumber) || 1;

  const count = await Review.countDocuments({
    movie: movieId,
  });
  const reviews = await Review.find({ movie: movieId })
    .populate("user", "name avatarUrl") // Chỉ lấy tên và avatar của user
    .limit(pageSize)
    .skip(pageSize * (page - 1))
    .sort({ createdAt: -1 }); // Sắp xếp mới nhất lên đầu

  // TODO: Có thể cần lấy thêm các replies cho mỗi review gốc ở đây nếu muốn hiển thị dạng nested

  res.json({ reviews, page, pages: Math.ceil(count / pageSize), count });
});

// @desc    Delete a review
// @route   DELETE /api/reviews/:reviewId
// @access  Private
const deleteReview = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;
  const userId = req.user._id;

  const review = await Review.findById(reviewId);

  if (!review) {
    res.status(404);
    throw new Error("Đánh giá không tồn tại.");
  }

  // Kiểm tra người dùng có quyền xóa không (là chủ sở hữu review)
  if (review.user.toString() !== userId.toString()) {
    res.status(401);
    throw new Error("Không được phép xóa đánh giá này.");
  }

  // Logic xóa replies không cần thiết vì người dùng chỉ xóa được review của chính mình
  // và parentReview đã được loại bỏ

  // Sử dụng findOneAndDelete để trigger 'post' middleware trong ReviewModel
  const deletedReview = await Review.findOneAndDelete({ _id: reviewId });
  if (deletedReview) {
    // Manually trigger rating calculation after deletion
    try {
      await Review.calculateAverageRating(deletedReview.movie);
    } catch (error) {
      console.error("Error calculating average rating after deletion:", error);
    }
    res.json({ message: "Đánh giá đã được xóa." });
  } else {
    res.status(404);
    throw new Error(
      "Không tìm thấy đánh giá để xoá hoặc đã được xoá trước đó."
    );
  }
});

// @desc    Fix rating calculation for a specific movie
// @route   POST /api/reviews/fix-rating/:movieId
// @access  Public (temporary for debugging)
const fixMovieRating = asyncHandler(async (req, res) => {
  const { movieId } = req.params;

  try {
    // Manually trigger rating calculation
    await Review.calculateAverageRating(movieId);

    // Get updated movie data
    const updatedMovie = await MovieMetadata.findById(movieId);

    res.json({
      message: "Rating calculation completed",
      movieId,
      appAverageRating: updatedMovie?.appAverageRating || 0,
      appRatingCount: updatedMovie?.appRatingCount || 0,
    });
  } catch (error) {
    console.error("Error fixing movie rating:", error);
    res.status(500);
    throw new Error("Error fixing movie rating");
  }
});

export {
  createOrUpdateReview,
  getReviewsForMovie,
  deleteReview,
  fixMovieRating,
};
