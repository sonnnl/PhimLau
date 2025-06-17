import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL;

const getAuthConfig = () => {
  const token = localStorage.getItem("movieAppToken");
  if (!token) return {};
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

/**
 * Lấy lịch sử xem phim của người dùng
 * @param {number} page
 * @param {number} limit
 */
export const getWatchHistory = async (page = 1, limit = 18) => {
  try {
    const response = await axios.get(
      `${API_URL}/watch-history?page=${page}&limit=${limit}`,
      getAuthConfig()
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching watch history:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Lỗi kết nối server",
    };
  }
};

/**
 * Xóa một session khỏi lịch sử xem
 * @param {string} sessionId
 */
export const deleteWatchSession = async (sessionId) => {
  try {
    const response = await axios.delete(
      `${API_URL}/watch-history/${sessionId}`,
      getAuthConfig()
    );
    return response.data;
  } catch (error) {
    console.error("Error deleting watch session:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Lỗi kết nối server",
    };
  }
};

/**
 * Báo cáo một sự kiện xem phim (để tính view và cập nhật lịch sử)
 * @param {string} movieId
 * @param {string} episodeSlug
 * @param {string} serverName
 */
export const reportWatchEvent = async (movieId, episodeSlug, serverName) => {
  try {
    const payload = { movieId, episodeSlug, serverName };
    // Lời gọi fire-and-forget, không cần xử lý kết quả
    await axios.post(
      `${API_URL}/watch-history/report`,
      payload,
      getAuthConfig()
    );
    return { success: true };
  } catch (error) {
    // Không cần thông báo lỗi cho người dùng vì đây là tiến trình chạy nền
    console.error(
      "Error reporting watch event:",
      error.response?.data || error.message
    );
    return { success: false };
  }
};

/**
 * Lấy danh sách các slug tập phim đã xem cho một phim cụ thể
 * @param {string} movieId
 */
export const getMovieWatchStatus = async (movieId) => {
  // Không gửi yêu cầu nếu không có movieId hoặc không có token
  const token = localStorage.getItem("movieAppToken");
  if (!movieId || !token) {
    return { success: true, data: [] };
  }

  try {
    const response = await axios.get(
      `${API_URL}/watch-history/status/${movieId}`,
      getAuthConfig()
    );
    return response.data; // Should be { success: true, data: ['slug1', 'slug2'] }
  } catch (error) {
    console.error("Error fetching movie watch status:", error);
    // Lỗi có thể xảy ra nếu người dùng chưa đăng nhập, không cần báo cáo
    return { success: false, data: [] };
  }
};
