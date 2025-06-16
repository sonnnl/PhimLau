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

// Toggle like for thread or reply
export const toggleLike = async (targetType, targetId) => {
  const response = await apiClient.post("/likes/toggle", {
    targetType,
    targetId,
  });
  return response.data;
};

// Get like status for multiple items
export const getLikeStatus = async (items) => {
  const response = await apiClient.post("/likes/status", { items });
  return response.data;
};

// Get user's liked items
export const getUserLikes = async (params = {}) => {
  const queryParams = new URLSearchParams();

  if (params.page) queryParams.append("page", params.page);
  if (params.limit) queryParams.append("limit", params.limit);
  if (params.targetType) queryParams.append("targetType", params.targetType);

  const response = await apiClient.get(`/likes/my-likes?${queryParams}`);
  return response.data;
};

// Get like statistics for items
export const getLikeStats = async (targetType, targetIds) => {
  const response = await apiClient.post("/likes/stats", {
    targetType,
    targetIds,
  });
  return response.data;
};

// Get top liked items
export const getTopLikedItems = async (params = {}) => {
  const queryParams = new URLSearchParams();

  if (params.targetType) queryParams.append("targetType", params.targetType);
  if (params.limit) queryParams.append("limit", params.limit);
  if (params.timeframe) queryParams.append("timeframe", params.timeframe);

  const response = await apiClient.get(`/likes/top?${queryParams}`);
  return response.data;
};
