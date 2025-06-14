import { useState, useEffect, useCallback } from "react";
import movieService from "../services/movieService";

const useMovieDetail = (slug) => {
  const [movieDetails, setMovieDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMovieDetails = useCallback(async () => {
    if (!slug) return;

    setLoading(true);
    setError(null);

    try {
      const data = await movieService.getMovieDetails(slug);
      setMovieDetails(data);
    } catch (err) {
      console.error(`Error fetching details for ${slug}:`, err);
      setError(err.message || "Không thể tải thông tin phim.");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  const refreshMovieDetails = useCallback(async () => {
    try {
      const data = await movieService.getMovieDetails(slug);
      setMovieDetails(data);
    } catch (err) {
      console.error("Error refreshing movie details:", err);
    }
  }, [slug]);

  useEffect(() => {
    fetchMovieDetails();
  }, [fetchMovieDetails]);

  return {
    movieDetails,
    loading,
    error,
    refreshMovieDetails,
  };
};

export default useMovieDetail;
