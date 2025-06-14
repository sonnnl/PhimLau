import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5001/api";

const movieService = {
  getLatestMovies: async (page = 1) => {
    try {
      const response = await axios.get(`${API_URL}/movies/latest?page=${page}`);
      return response.data;
    } catch (error) {
      console.error(
        "Error fetching latest movies:",
        error.response ? error.response.data : error.message
      );
      throw error.response ? error.response.data : error;
    }
  },

  getMovieDetails: async (slug) => {
    try {
      const response = await axios.get(`${API_URL}/movies/details/${slug}`);
      return response.data;
    } catch (error) {
      console.error(
        `Error fetching movie details for ${slug}:`,
        error.response ? error.response.data : error.message
      );
      throw error.response ? error.response.data : error;
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
        `Error searching movies with keyword ${keyword}:`,
        error.response ? error.response.data : error.message
      );
      throw error.response ? error.response.data : error;
    }
  },

  getSingleMovies: async (page = 1) => {
    try {
      const response = await axios.get(`${API_URL}/movies/single?page=${page}`);
      // Giả sử backend trả về cấu trúc { items: [], pagination: {} } hoặc tương tự
      // như getLatestMovies để đồng nhất với frontend hiện tại
      return response.data;
    } catch (error) {
      console.error(
        "Error fetching single movies:",
        error.response ? error.response.data : error.message
      );
      throw error.response ? error.response.data : error;
    }
  },

  getSeriesMovies: async (page = 1) => {
    try {
      const response = await axios.get(`${API_URL}/movies/series?page=${page}`);
      return response.data;
    } catch (error) {
      console.error(
        "Error fetching series movies:",
        error.response ? error.response.data : error.message
      );
      throw error.response ? error.response.data : error;
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
        `Error fetching movies for genre ${genreSlug}:`,
        error.response ? error.response.data : error.message
      );
      throw error.response ? error.response.data : error;
    }
  },
};

export default movieService;
