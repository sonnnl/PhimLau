import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL;

// Tạo axios instance
const userAPI = axios.create({
  baseURL: `${API_URL}/user`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor để tự động thêm token vào headers
userAPI.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("movieAppToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor để xử lý lỗi chung
userAPI.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("movieAppToken");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// ================================
// USER PROFILE SERVICES
// ================================

export const getUserProfile = async () => {
  try {
    const response = await userAPI.get("/profile");
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Lỗi khi lấy thông tin profile"
    );
  }
};

export const updateUserProfile = async (profileData) => {
  try {
    const response = await userAPI.put("/profile", profileData);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Lỗi khi cập nhật profile"
    );
  }
};

export const updateUserPassword = async (passwordData) => {
  try {
    const response = await userAPI.put("/password", passwordData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Lỗi khi đổi mật khẩu");
  }
};

export const uploadAvatar = async (formData) => {
  try {
    const response = await userAPI.post("/avatar", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Lỗi khi upload avatar");
  }
};

export const getUserStats = async () => {
  try {
    const response = await userAPI.get("/stats");
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Lỗi khi lấy thống kê user"
    );
  }
};

export const getUserReviews = async (page = 1, limit = 10) => {
  try {
    const response = await userAPI.get("/reviews", {
      params: { page, limit },
    });
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Lỗi khi lấy danh sách đánh giá"
    );
  }
};

export const getUserThreads = async (page = 1, limit = 10, filters = {}) => {
  try {
    const params = { page, limit, ...filters };
    const response = await userAPI.get("/threads", { params });
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Lỗi khi lấy danh sách bài viết forum"
    );
  }
};

export const deleteUserReview = async (reviewId) => {
  try {
    const response = await userAPI.delete(`/reviews/${reviewId}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Lỗi khi xóa đánh giá");
  }
};

export default userAPI;
