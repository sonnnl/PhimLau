import axios from "axios";

// Đảm bảo biến môi trường được thiết lập đúng trong file .env ở thư mục frontend
// Ví dụ: REACT_APP_API_URL=http://localhost:5001/api
const API_URL = process.env.REACT_APP_API_URL;

const reviewService = {
  // Tạo hoặc cập nhật một review
  createOrUpdateReview: async (movieId, reviewData, token) => {
    try {
      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      };
      // reviewData nên là { rating, content }
      const { data } = await axios.post(
        `${API_URL}/reviews/${movieId}`,
        reviewData,
        config
      );
      return data;
    } catch (error) {
      console.error("Error submitting review:", error.response || error);
      throw (
        error.response?.data?.message ||
        error.message ||
        "Error submitting review"
      );
    }
  },

  // Lấy reviews cho một phim, có phân trang
  getReviewsForMovie: async (movieId, pageNumber = 1) => {
    try {
      const { data } = await axios.get(
        `${API_URL}/reviews/${movieId}?pageNumber=${pageNumber}`
      );
      // API trả về { reviews, page, pages, count }
      return data;
    } catch (error) {
      console.error("Error fetching reviews:", error.response || error);
      throw (
        error.response?.data?.message ||
        error.message ||
        "Error fetching reviews"
      );
    }
  },

  // Xóa một review
  deleteReview: async (reviewId, token) => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      const { data } = await axios.delete(
        `${API_URL}/reviews/${reviewId}`,
        config
      );
      return data;
    } catch (error) {
      console.error("Error deleting review:", error.response || error);
      throw (
        error.response?.data?.message ||
        error.message ||
        "Error deleting review"
      );
    }
  },
};

export default reviewService;
