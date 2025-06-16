import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5001/api";

const movieService = {
  getLatestMovies: async (page = 1) => {
    try {
      const response = await axios.get(`${API_URL}/movies/latest?page=${page}`);
      return response.data;
    } catch (error) {
      console.error(
        "Lỗi khi lấy phim mới nhất:",
        error.response?.data || error.message
      );
      throw error;
    }
  },

  getMovieDetails: async (slug) => {
    try {
      const response = await axios.get(`${API_URL}/movies/details/${slug}`);
      return response.data;
    } catch (error) {
      console.error(
        "Lỗi khi lấy chi tiết phim:",
        error.response?.data || error.message
      );
      throw error;
    }
  },

  searchMovies: async (keyword, page = 1) => {
    try {
      const response = await axios.get(
        `${API_URL}/movies/search?keyword=${encodeURIComponent(
          keyword
        )}&page=${page}`
      );
      return response.data;
    } catch (error) {
      console.error(
        "Lỗi khi tìm kiếm phim:",
        error.response?.data || error.message
      );
      throw error;
    }
  },

  getSingleMovies: async (page = 1) => {
    try {
      const response = await axios.get(`${API_URL}/movies/single?page=${page}`);
      return response.data;
    } catch (error) {
      console.error(
        "Lỗi khi lấy phim lẻ:",
        error.response?.data || error.message
      );
      throw error;
    }
  },

  getSeriesMovies: async (page = 1) => {
    try {
      const response = await axios.get(`${API_URL}/movies/series?page=${page}`);
      return response.data;
    } catch (error) {
      console.error(
        "Lỗi khi lấy phim bộ:",
        error.response?.data || error.message
      );
      throw error;
    }
  },

  getMoviesByGenre: async (genreSlug, page = 1) => {
    try {
      const response = await axios.get(
        `${API_URL}/movies/genre/${genreSlug}?page=${page}`
      );
      return response.data;
    } catch (error) {
      console.error(
        "Lỗi khi lấy phim theo thể loại:",
        error.response?.data || error.message
      );
      throw error;
    }
  },
};

export default movieService;
