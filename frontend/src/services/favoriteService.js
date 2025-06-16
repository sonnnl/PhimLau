import axios from "axios";

const API_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5001/api/favorites";

const getAuthConfig = () => {
  const token = localStorage.getItem("myMovieAppToken");

  if (!token) {
    return {};
  }

  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

const favoriteService = {
  // Lấy danh sách phim yêu thích của người dùng
  getMyFavorites: async (page = 1, limit = 12) => {
    try {
      const response = await axios.get(
        `${API_URL}/my-favorites?page=${page}&limit=${limit}`,
        getAuthConfig()
      );
      return response.data;
    } catch (error) {
      console.error(
        "Error fetching favorite movies:",
        error.response?.data || error.message
      );
      throw error;
    }
  },

  // Thêm phim vào danh sách yêu thích
  addFavorite: async (movieId) => {
    try {
      const response = await axios.post(
        `${API_URL}/add`,
        { movieId },
        getAuthConfig()
      );
      return response.data;
    } catch (error) {
      console.error(
        "Error adding favorite:",
        error.response?.data || error.message
      );
      throw error;
    }
  },

  // Xóa phim khỏi danh sách yêu thích
  removeFavorite: async (movieId) => {
    try {
      const response = await axios.delete(`${API_URL}/remove`, {
        ...getAuthConfig(),
        data: { movieId },
      });
      return response.data;
    } catch (error) {
      console.error(
        "Error removing favorite:",
        error.response?.data || error.message
      );
      throw error;
    }
  },

  // Kiểm tra trạng thái yêu thích của một phim
  checkFavoriteStatus: async (movieId) => {
    try {
      const response = await axios.get(
        `${API_URL}/status/${movieId}`,
        getAuthConfig()
      );
      return response.data;
    } catch (error) {
      console.error(
        "Error checking favorite status:",
        error.response?.data || error.message
      );
      throw error;
    }
  },
};

export default favoriteService;
