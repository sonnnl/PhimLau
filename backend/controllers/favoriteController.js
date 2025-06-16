import asyncHandler from "express-async-handler";
import UserFavorite from "../models/UserFavoriteModel.js";
import MovieMetadata from "../models/MovieMetadataModel.js";

// @desc    Add a movie to user's favorites
// @route   POST /api/favorites/add
// @access  Private
const addFavorite = asyncHandler(async (req, res) => {
  const { movieId } = req.body;
  const userId = req.user._id;

  if (!movieId) {
    res.status(400);
    throw new Error("Movie ID is required");
  }

  // Kiểm tra xem phim có tồn tại trong metadata không
  const movieExists = await MovieMetadata.findById(movieId);
  if (!movieExists) {
    res.status(404);
    throw new Error("Movie not found in metadata");
  }

  // Kiểm tra xem đã yêu thích chưa
  const alreadyFavorited = await UserFavorite.findOne({
    user: userId,
    movie: movieId,
  });

  if (alreadyFavorited) {
    res.status(400);
    throw new Error("Movie already in favorites");
  }

  const favorite = await UserFavorite.create({
    user: userId,
    movie: movieId,
  });

  // Tăng đếm số lượt yêu thích trong metadata
  await MovieMetadata.findByIdAndUpdate(movieId, {
    $inc: { appTotalFavorites: 1 },
  });

  res.status(201).json({
    message: "Movie added to favorites successfully",
    favorite,
  });
});

// @desc    Remove a movie from user's favorites
// @route   DELETE /api/favorites/remove
// @access  Private
const removeFavorite = asyncHandler(async (req, res) => {
  const { movieId } = req.body;
  const userId = req.user._id;

  if (!movieId) {
    res.status(400);
    throw new Error("Movie ID is required");
  }

  const favorite = await UserFavorite.findOneAndDelete({
    user: userId,
    movie: movieId,
  });

  if (!favorite) {
    res.status(404);
    throw new Error("Favorite entry not found");
  }

  // Giảm đếm số lượt yêu thích trong metadata
  await MovieMetadata.findByIdAndUpdate(movieId, {
    $inc: { appTotalFavorites: -1 },
  });

  res.status(200).json({ message: "Movie removed from favorites" });
});

// @desc    Get user's favorite movies
// @route   GET /api/favorites/my-favorites
// @access  Private
const getMyFavorites = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;
  const skip = (page - 1) * limit;

  const favorites = await UserFavorite.find({ user: userId })
    .populate("movie") // Lấy thông tin chi tiết của phim từ MovieMetadata
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const totalFavorites = await UserFavorite.countDocuments({ user: userId });

  res.status(200).json({
    items: favorites.map((fav) => ({
      // Ánh xạ dữ liệu để khớp với cấu trúc của ForumMovieCard
      movieId: fav.movie._id,
      movieSlug: fav.movie.slug,
      movieTitle: fav.movie.name,
      moviePosterUrl: fav.movie.posterUrl || fav.movie.thumbUrl,
      movieType: fav.movie.type,
      movieYear: fav.movie.year,
      isPrimary: false, // Mặc định, có thể thay đổi nếu có logic
      appAverageRating: fav.movie.appAverageRating,
      appRatingCount: fav.movie.appRatingCount,
      appTotalViews: fav.movie.appTotalViews,
      appTotalFavorites: fav.movie.appTotalFavorites,
      _id: fav._id, // Giữ lại ID của bản ghi favorite
    })),
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(totalFavorites / limit),
      totalItems: totalFavorites,
    },
  });
});

// @desc    Check if a movie is in user's favorites
// @route   GET /api/favorites/status/:movieId
// @access  Private
const checkFavoriteStatus = asyncHandler(async (req, res) => {
  const { movieId } = req.params;
  const userId = req.user._id;

  const favorite = await UserFavorite.findOne({
    user: userId,
    movie: movieId,
  });

  res.status(200).json({ isFavorited: !!favorite });
});

export { addFavorite, removeFavorite, getMyFavorites, checkFavoriteStatus };
