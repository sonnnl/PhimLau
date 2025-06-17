import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL;

/**
 * Lấy thông tin profile công khai của một người dùng
 * @param {string} userId ID của người dùng
 * @returns {Promise<any>} Dữ liệu profile
 */
export const getPublicProfile = async (userId) => {
  try {
    const response = await axios.get(`${API_URL}/social/profile/${userId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching public profile:", error);
    // Ném lỗi để component có thể bắt và xử lý
    throw new Error(
      error.response?.data?.message || "Không thể tải thông tin người dùng."
    );
  }
};
