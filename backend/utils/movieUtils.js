import axios from "axios";
import MovieMetadata from "../models/MovieMetadataModel.js";

const PHIM_API_DOMAIN = "https://phimapi.com";

/**
 * Gets or creates movie metadata in our local DB.
 * This function is the single source of truth for creating/updating movie metadata.
 */
export const getOrCreateMovieMetadata = async (movieDataFromApi) => {
  if (!movieDataFromApi || !movieDataFromApi._id) {
    console.error(
      "Invalid movieDataFromApi provided to getOrCreateMovieMetadata"
    );
    return null;
  }

  try {
    let movieMetadata = await MovieMetadata.findById(movieDataFromApi._id);

    if (movieMetadata) {
      movieMetadata.lastAccessedByApp = Date.now();
      if (
        (!movieMetadata.category || movieMetadata.category.length === 0) &&
        movieDataFromApi.category?.length > 0
      ) {
        movieMetadata.category = movieDataFromApi.category.map((cat) => ({
          name: cat.name,
          slug: cat.slug,
        }));
      }
      await movieMetadata.save();
    } else {
      movieMetadata = new MovieMetadata({
        _id: movieDataFromApi._id,
        slug: movieDataFromApi.slug,
        name: movieDataFromApi.name,
        originName: movieDataFromApi.origin_name || movieDataFromApi.name,
        posterUrl: movieDataFromApi.poster_url,
        thumbUrl: movieDataFromApi.thumb_url,
        year: movieDataFromApi.year,
        type: movieDataFromApi.type,
        category:
          movieDataFromApi.category?.map((cat) => ({
            name: cat.name,
            slug: cat.slug,
          })) || [],
        lastAccessedByApp: Date.now(),
      });
      await movieMetadata.save();
    }
    return movieMetadata;
  } catch (error) {
    console.error(
      `Error in getOrCreateMovieMetadata for movieId ${movieDataFromApi._id}:`,
      error
    );
    return null;
  }
};

/**
 * Takes an array of basic movie objects and enriches them with full details from the API.
 */
export const enrichMoviesWithDetails = async (movies) => {
  if (!movies || !Array.isArray(movies) || movies.length === 0) {
    return [];
  }

  const detailedMoviesPromises = movies.map(async (basicMovie) => {
    if (!basicMovie || !basicMovie.slug) {
      return null;
    }
    try {
      const detailResponse = await axios.get(
        `${PHIM_API_DOMAIN}/phim/${basicMovie.slug}`
      );
      if (detailResponse.data?.movie) {
        const movieMetadata = await getOrCreateMovieMetadata(
          detailResponse.data.movie
        );
        return {
          ...detailResponse.data.movie,
          movieMetadata,
        };
      }
      return null;
    } catch (e) {
      console.error(
        `Failed to fetch full details for ${basicMovie.slug}:`,
        e.message
      );
      // Fallback to basic info if detail fetch fails
      const movieMetadata = await getOrCreateMovieMetadata(basicMovie);
      return {
        ...basicMovie,
        movieMetadata: movieMetadata,
      };
    }
  });

  const detailedMovies = await Promise.all(detailedMoviesPromises);
  return detailedMovies.filter(Boolean); // Filter out any null results from failed fetches
};

/**
 * Returns a user-friendly display name for a movie type.
 */
export const getMovieTypeDisplay = (type) => {
  const typeMap = {
    single: "Phim lẻ",
    series: "Phim bộ",
    hoathinh: "Hoạt hình",
    tvshows: "TV Shows",
  };
  return typeMap[type] || type || "N/A";
};

/**
 * Ensures the poster URL is a full URL, adding a CDN prefix if necessary.
 */
export const getOptimizedPosterUrl = (posterPath) => {
  if (!posterPath) {
    return "https://via.placeholder.com/300x450/e2e8f0/718096?text=No+Image";
  }
  if (posterPath.startsWith("http")) {
    return posterPath;
  }
  return `https://img.phimapi.com/${posterPath}`;
};
