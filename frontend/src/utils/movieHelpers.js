/**
 * Extract YouTube video ID from URL
 * @param {string} url - YouTube URL
 * @returns {string|null} - Video ID or null if not found
 */
export const extractYouTubeVideoId = (url) => {
  if (!url) return null;
  const regex =
    /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

/**
 * Format movie duration for display
 * @param {string} duration - Duration string from API
 * @returns {string} - Formatted duration
 */
export const formatDuration = (duration) => {
  if (!duration) return "N/A";

  // If already in readable format, return as is
  if (duration.includes("phút") || duration.includes("giờ")) {
    return duration;
  }

  // Convert minutes to readable format
  const minutes = parseInt(duration, 10);
  if (isNaN(minutes)) return duration;

  if (minutes < 60) {
    return `${minutes} phút`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours} giờ`;
  }

  return `${hours} giờ ${remainingMinutes} phút`;
};

/**
 * Get movie type display name
 * @param {string} type - Movie type from API
 * @returns {string} - Display name
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
 * Check if movie has episodes
 * @param {object} movieDetails - Movie details object
 * @returns {boolean} - True if has episodes
 */
export const hasEpisodes = (movieDetails) => {
  return (
    movieDetails?.episodes?.length > 0 &&
    movieDetails.episodes.some((server) => server.server_data?.length > 0)
  );
};

/**
 * Get total episodes count
 * @param {array} episodes - Episodes array from API
 * @returns {number} - Total episodes count
 */
export const getTotalEpisodesCount = (episodes) => {
  if (!episodes || !Array.isArray(episodes)) return 0;

  return episodes.reduce((total, server) => {
    return total + (server.server_data?.length || 0);
  }, 0);
};

/**
 * Generate movie share URL
 * @param {string} slug - Movie slug
 * @returns {string} - Share URL
 */
export const generateShareUrl = (slug) => {
  const baseUrl = window.location.origin;
  return `${baseUrl}/movie/${slug}`;
};

/**
 * Format rating for display
 * @param {number} rating - Rating value
 * @param {number} precision - Decimal places (default: 1)
 * @returns {string} - Formatted rating
 */
export const formatRating = (rating, precision = 1) => {
  if (!rating || isNaN(rating)) return "0.0";
  return Number(rating).toFixed(precision);
};
