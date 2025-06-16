import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5001/api";

// Create axios instance với admin config
const adminAPI = axios.create({
  baseURL: `${API_URL}/admin`,
  headers: {
    "Content-Type": "application/json",
    "Cache-Control": "no-cache, no-store, must-revalidate",
    Pragma: "no-cache",
    Expires: "0",
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

export const updateUserStatus = async (userId, statusData) => {
  try {
    const response = await adminAPI.patch(
      `/users/${userId}/status`,
      statusData
    );
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Lỗi khi cập nhật trạng thái"
    );
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

// Export adminAPI instance for direct use
export const adminApiClient = adminAPI;

// ================================
// REPORT SERVICES
// ================================
export const getReportDetails = async (reportId) => {
  try {
    const response = await adminApiClient.get(`/forum/reports/${reportId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error("Không thể lấy chi tiết báo cáo");
  }
};

/**
 * Resolves a report by deleting the content.
 * @param {string} reportId - The ID of the report to resolve.
 * @returns {Promise<Object>} The API response.
 */
const resolveReportAndDelete = async (reportId) => {
  try {
    const response = await adminApiClient.post(
      `/forum/reports/${reportId}/delete`
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error("Không thể xóa nội dung");
  }
};

/**
 * Resolves a report by requesting an edit from the user.
 * @param {string} reportId - The ID of the report to resolve.
 * @param {string} reason - The reason for the edit request.
 * @returns {Promise<Object>} The API response.
 */
const resolveReportAndRequestEdit = async (reportId, reason) => {
  try {
    const response = await adminApiClient.post(
      `/forum/reports/${reportId}/request-edit`,
      { reason }
    );
    return response.data;
  } catch (error) {
    throw (
      error.response?.data || new Error("Không thể yêu cầu chỉnh sửa nội dung")
    );
  }
};

// Export default object với tất cả services
export default {
  // Dashboard
  getDashboardStats,

  // User Management
  getAllUsers,
  updateUserRole,
  updateUserStatus,
  deleteUser,
  createFirstAdmin,

  // Notifications
  sendNotification,
  getNotificationStats,
  getAllNotifications,

  // Report
  getReportDetails,

  // New functions
  resolveReportAndDelete,
  resolveReportAndRequestEdit,
};
