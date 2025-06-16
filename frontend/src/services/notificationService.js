import axios from "axios";

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5001/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("movieAppToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Get user notifications with pagination and filters
export const getUserNotifications = async (params = {}) => {
  const queryParams = new URLSearchParams();

  if (params.page) queryParams.append("page", params.page);
  if (params.limit) queryParams.append("limit", params.limit);
  if (params.type) queryParams.append("type", params.type);
  if (params.isRead !== undefined) queryParams.append("isRead", params.isRead);

  const response = await apiClient.get(`/notifications?${queryParams}`);
  return response.data;
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId) => {
  const response = await apiClient.put(`/notifications/${notificationId}/read`);
  return response.data;
};

// Mark notification as clicked
export const markNotificationAsClicked = async (notificationId) => {
  const response = await apiClient.put(
    `/notifications/${notificationId}/click`
  );
  return response.data;
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async () => {
  const response = await apiClient.put("/notifications/read-all");
  return response.data;
};

// Delete notification
export const deleteNotification = async (notificationId) => {
  const response = await apiClient.delete(`/notifications/${notificationId}`);
  return response.data;
};

// Get notification statistics
export const getNotificationStats = async () => {
  const response = await apiClient.get("/notifications/stats");
  return response.data;
};

// Real-time notification helpers
export const getNotificationIcon = (type) => {
  const icons = {
    thread_reply: "💬",
    thread_like: "❤️",
    reply_like: "👍",
    mention: "📢",
    follow: "👥",
    system: "🔔",
    admin_message: "⚠️",
    moderation: "🛡️",
    moderation_warning: "⚠️",
    account_suspended: "🚫",
    account_banned: "🔒",
    content_removed: "🗑️",
    content_edited: "✏️",
  };
  return icons[type] || "🔔";
};

export const getNotificationColor = (type) => {
  const colors = {
    thread_reply: "blue",
    thread_like: "red",
    reply_like: "green",
    mention: "orange",
    follow: "purple",
    system: "gray",
    admin_message: "yellow",
    moderation: "red",
    moderation_warning: "orange",
    account_suspended: "red",
    account_banned: "red",
    content_removed: "red",
    content_edited: "yellow",
  };
  return colors[type] || "gray";
};
