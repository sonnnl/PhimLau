import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5001/api";

const movieService = {
  getLatestMovies: async (page = 1, limit = 18) => {
    try {
      const response = await axios.get(
        `${API_URL}/movies/latest?page=${page}&limit=${limit}`
      );
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

  searchMovies: async (params) => {
    try {
      // Xây dựng query string từ object params
      // Ví dụ params: { keyword: '...', page: 1, category: 'hanh-dong', ... }
      const queryParams = new URLSearchParams();
      for (const key in params) {
        if (params[key]) {
          // Chỉ thêm vào query nếu có giá trị
          queryParams.append(key, params[key]);
        }
      }
      const response = await axios.get(
        `${API_URL}/movies/search?${queryParams.toString()}`
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

  getSingleMovies: async (page = 1, limit = 18) => {
    try {
      const response = await axios.get(
        `${API_URL}/movies/single?page=${page}&limit=${limit}`
      );
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

  getMoviesByGenre: async (genreSlug, page = 1, limit = 12) => {
    try {
      const response = await axios.get(
        `${API_URL}/movies/genre/${genreSlug}?page=${page}&limit=${limit}`
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

  getMovieGenres: async () => {
    try {
      const response = await axios.get(`${API_URL}/movies/genres`);
      return response.data;
    } catch (error) {
      console.error(
        "Lỗi khi lấy danh sách thể loại:",
        error.response?.data || error.message
      );
      throw error;
    }
  },

  getMovieCountries: async () => {
    try {
      const response = await axios.get(`${API_URL}/movies/countries`);
      return response.data;
    } catch (error) {
      console.error(
        "Lỗi khi lấy danh sách quốc gia:",
        error.response?.data || error.message
      );
      throw error;
    }
  },
};

export default movieService;
