import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5001/api";

// Create axios instance với admin config
const adminAPI = axios.create({
  baseURL: `${API_URL}/admin`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token to requests
adminAPI.interceptors.request.use(
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

// Handle response errors
adminAPI.interceptors.response.use(
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
// DASHBOARD SERVICES
// ================================
export const getDashboardStats = async () => {
  try {
    const response = await adminAPI.get("/stats");
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Lỗi khi lấy thống kê dashboard"
    );
  }
};

// ================================
// USER MANAGEMENT SERVICES
// ================================
export const getAllUsers = async (params = {}) => {
  try {
    const { page = 1, limit = 10, search = "", role = "" } = params;
    const response = await adminAPI.get("/users", {
      params: { page, limit, search, role },
    });
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Lỗi khi lấy danh sách người dùng"
    );
  }
};

export const updateUserRole = async (userId, role) => {
  try {
    const response = await adminAPI.patch(`/users/${userId}/role`, { role });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Lỗi khi cập nhật quyền");
  }
};

export const deleteUser = async (userId) => {
  try {
    const response = await adminAPI.delete(`/users/${userId}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Lỗi khi xóa người dùng");
  }
};

export const createFirstAdmin = async (adminData) => {
  try {
    const response = await axios.post(
      `${API_URL}/admin/create-first-admin`,
      adminData
    );
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Lỗi khi tạo admin đầu tiên"
    );
  }
};

// ================================
// NOTIFICATION SERVICES
// ================================
export const sendNotification = async (notificationData) => {
  try {
    const response = await adminAPI.post(
      "/notifications/send",
      notificationData
    );
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Lỗi khi gửi thông báo");
  }
};

export const getNotificationStats = async () => {
  try {
    const response = await adminAPI.get("/notifications/stats");
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Lỗi khi lấy thống kê thông báo"
    );
  }
};

export const getAllNotifications = async (params = {}) => {
  try {
    const { page = 1, limit = 20 } = params;
    const response = await adminAPI.get("/notifications", {
      params: { page, limit },
    });
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Lỗi khi lấy danh sách thông báo"
    );
  }
};

// ================================
// UTILITY FUNCTIONS
// ================================
export const testAdminAccess = async () => {
  try {
    const response = await adminAPI.get("/stats");
    return {
      success: true,
      message: "✅ Admin access OK!",
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      message: `❌ Lỗi: ${error.response?.data?.message || error.message}`,
      status: error.response?.status,
    };
  }
};

// Export default object với tất cả services
export default {
  // Dashboard
  getDashboardStats,

  // User Management
  getAllUsers,
  updateUserRole,
  deleteUser,
  createFirstAdmin,

  // Notifications
  sendNotification,
  getNotificationStats,
  getAllNotifications,

  // Utility
  testAdminAccess,
};
