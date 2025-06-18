import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5001/api";

// Create an axios instance for recommendation service
const recommendationAPI = axios.create({
  baseURL: `${API_BASE_URL}/recommendations`,
});

// Use interceptor to automatically add the token from localStorage
recommendationAPI.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("movieAppToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // If no token, the request will be sent without Authorization header.
    // The backend will handle it (e.g., return a 401 Unauthorized error or public data).
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const getRecommendedMovies = async () => {
  try {
    // The request will now automatically have the Authorization header if the token exists
    const response = await recommendationAPI.get("/");
    return response.data;
  } catch (error) {
    // Gracefully handle cases where the user is not logged in (e.g., 401 Unauthorized)
    if (
      error.response &&
      (error.response.status === 401 || error.response.status === 403)
    ) {
      // Return a consistent "empty" state for the frontend to handle
      return {
        recommendations: [],
        message: "User not logged in or unauthorized.",
      };
    }
    // Log other errors but don't crash the entire component
    console.error("Error fetching recommendations:", error);
    // You might want to re-throw for a global error handler, or just return the empty state
    // For a non-critical component like recommendations, returning empty is often safer.
    return { recommendations: [], message: "Failed to fetch recommendations." };
  }
};

const recommendationService = {
  getRecommendedMovies,
};

export default recommendationService;
