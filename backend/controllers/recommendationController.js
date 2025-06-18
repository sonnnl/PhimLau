import asyncHandler from "express-async-handler";
import axios from "axios";
import UserFavorite from "../models/UserFavoriteModel.js";
import MovieMetadata from "../models/MovieMetadataModel.js";
import WatchSession from "../models/WatchSessionModel.js";
import { enrichMoviesWithDetails } from "../utils/movieUtils.js";

const PHIM_API_DOMAIN = "https://phimapi.com";

/**
 * @desc    Get movie recommendations for a user
 * @route   GET /api/recommendations
 * @access  Private
 */
const getRecommendedMovies = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Step 1: Get user's favorite movies and watched movies
  const favorites = await UserFavorite.find({ user: userId }).select(
    "movie -_id"
  );
  const watchHistory = await WatchSession.find({ user: userId })
    .sort({ lastWatchedAt: -1 })
    .select("movie -_id");

  const favoriteMovieIds = favorites.map((fav) => fav.movie);
  const watchedMovieIds = watchHistory.map((watch) => watch.movie);
  const userInteractedMovieIds = [
    ...new Set([...favoriteMovieIds, ...watchedMovieIds]),
  ];

  if (userInteractedMovieIds.length === 0) {
    // If user has no interactions, return latest movies or popular movies as a fallback
    // For now, we'll return an empty array with a message.
    return res.json({
      message:
        "Xem hoặc yêu thích một vài phim để chúng tôi có thể gợi ý phim cho bạn!",
      recommendations: [],
    });
  }

  // Step 2: Get genres from these movies
  const interactedMovies = await MovieMetadata.find({
    _id: { $in: userInteractedMovieIds },
  }).select("category");

  if (interactedMovies.length === 0) {
    return res.json({
      message: "Không tìm thấy dữ liệu về các phim bạn đã tương tác.",
      recommendations: [],
    });
  }

  const genreCounts = interactedMovies
    .flatMap((movie) => movie.category.map((cat) => cat.slug))
    .reduce((acc, slug) => {
      acc[slug] = (acc[slug] || 0) + 1;
      return acc;
    }, {});

  // Sort genres by frequency and take the top 3
  const topGenres = Object.entries(genreCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([slug]) => slug);

  if (topGenres.length === 0) {
    return res.json({
      message: "Không thể xác định được thể loại yêu thích của bạn.",
      recommendations: [],
    });
  }

  // Step 3: Fetch movies from external API based on top genres concurrently
  const recommendationPromises = topGenres.map((genreSlug) => {
    // This is the CORRECT endpoint structure based on the API documentation.
    return axios
      .get(`${PHIM_API_DOMAIN}/v1/api/the-loai/${genreSlug}`, {
        params: {
          limit: 10,
        },
      })
      .catch((error) => {
        console.error(
          `Error fetching recommendations for genre ${genreSlug}:`,
          error.message
        );
        return null;
      });
  });

  const responses = await Promise.all(recommendationPromises);

  // The movie items are in `response.data.data.items` for this endpoint.
  const recommendations = responses
    .filter((response) => response && response.data?.data?.items)
    .flatMap((response) => response.data.data.items);

  // Step 4: Filter out duplicates and movies user has already interacted with
  const uniqueRecommendations = recommendations.filter(
    (movie, index, self) =>
      !userInteractedMovieIds.includes(movie._id) &&
      index === self.findIndex((m) => m._id === movie._id)
  );

  // Step 5: Enrich final recommendations with full details
  const finalRecommendations = await enrichMoviesWithDetails(
    uniqueRecommendations
  );

  res.json({
    message: "Phim gợi ý cho bạn",
    recommendations: finalRecommendations.slice(0, 20), // Limit to 20 results
    basedOnGenres: topGenres,
  });
});

export { getRecommendedMovies };
