import axios from "axios";

// ===== API CONFIGURATION =====
const API_URL = process.env.REACT_APP_API_URL;

// Tạo axios instance riêng cho Forum API
const forumApiClient = axios.create({
  baseURL: `${API_URL}/forum`,
});

// ===== INTERCEPTOR SETUP =====
// Thêm token tự động nếu có
forumApiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("movieAppToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * ===== FORUM CATEGORIES =====
 * Lấy tất cả danh mục diễn đàn từ backend
 * @returns {Promise<Array<Object>>} Danh sách các danh mục forum
 * @route GET /api/forum/categories
 */
export const fetchAllForumCategories = async () => {
  try {
    const response = await forumApiClient.get("/categories");

    // 🔧 FIX: Backend trả về { success: true, data: [...] }
    // Frontend cần array trực tiếp
    if (response.data.success && response.data.data) {
      return response.data.data; // Extract array from nested structure
    }

    // Fallback: nếu backend trả về array trực tiếp
    if (Array.isArray(response.data)) {
      return response.data;
    }

    // Default: empty array để tránh lỗi .map
    console.warn("Unexpected API response structure:", response.data);
    return [];
  } catch (error) {
    console.error(
      "Lỗi khi lấy danh mục forum:",
      error.response?.data || error.message
    );
    throw error.response?.data || new Error("Không thể lấy danh mục forum");
  }
};

/**
 * Lấy danh sách chủ đề.
 * @param {object} params - Các tham số để query.
 * @param {string} [params.categorySlug] - Slug của danh mục để lọc.
 * @param {number} [params.page] - Số trang hiện tại.
 * @param {number} [params.limit] - Số lượng chủ đề mỗi trang.
 * @param {string} [params.sort] - Chuỗi để sắp xếp (ví dụ: '-createdAt').
 * @returns {Promise<Object>} Đối tượng chứa danh sách chủ đề và thông tin phân trang.
 */
export const fetchForumThreadsWithFilters = async ({
  categorySlug,
  page,
  limit,
  sort,
} = {}) => {
  try {
    // Build URL parameters for API call
    const urlParams = new URLSearchParams();
    if (categorySlug) urlParams.append("category", categorySlug);
    if (page) urlParams.append("page", page.toString());
    if (limit) urlParams.append("limit", limit.toString());
    if (sort) urlParams.append("sort", sort);

    const response = await forumApiClient.get(
      `/threads?${urlParams.toString()}`
    );
    return response.data; // Backend returns: { success, count, pagination, category, threads }
  } catch (error) {
    console.error(
      "Lỗi khi lấy danh sách threads:",
      error.response?.data || error.message
    );
    throw error.response?.data || new Error("Không thể lấy danh sách threads");
  }
};

/**
 * Tạo một chủ đề mới.
 * @param {object} threadData - Dữ liệu của chủ đề (title, content, categoryId).
 * @param {string} token - JWT token của người dùng.
 * @returns {Promise<Object>} Chủ đề vừa tạo.
 */
/**
 * 🎯 TẠO THREAD MỚI - Optimized with clear response handling
 * @param {Object} threadData - Dữ liệu thread (title, content, categoryId, movieMetadata)
 * @param {string} token - JWT token của user
 * @returns {Promise<Object>} Response với moderation info
 */
export const createThread = async (threadData, token) => {
  try {
    const response = await forumApiClient.post("/threads", threadData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // Validate response structure
    const data = response.data;

    if (!data.success) {
      throw new Error(data.message || "Phản hồi từ server không hợp lệ");
    }

    return data;
  } catch (error) {
    // Enhanced error handling với các trường hợp cụ thể
    if (error.response?.status === 400) {
      const message = error.response.data?.message || "Dữ liệu không hợp lệ";
      throw new Error(message);
    } else if (error.response?.status === 401) {
      throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
    } else if (error.response?.status === 403) {
      throw new Error("Bạn không có quyền thực hiện hành động này.");
    } else if (error.response?.status === 429) {
      throw new Error("Bạn đã tạo quá nhiều bài viết. Vui lòng thử lại sau.");
    } else if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    } else {
      throw new Error("Không thể tạo bài viết. Vui lòng thử lại sau.");
    }
  }
};

/**
 * Tạo một trả lời mới cho chủ đề.
 * @param {string} threadId - ID của chủ đề.
 * @param {object} replyData - Dữ liệu trả lời (content).
 * @param {string} token - JWT token của người dùng.
 * @returns {Promise<Object>} Trả lời vừa tạo.
 */
export const createReply = async (threadId, replyData, token) => {
  try {
    const response = await forumApiClient.post(
      `/threads/${threadId}/replies`,
      replyData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error(
      `Lỗi khi tạo reply cho thread ${threadId}:`,
      error.response?.data || error.message
    );
    throw (
      error.response?.data ||
      new Error(`Không thể tạo reply cho thread ${threadId}`)
    );
  }
};

/**
 * 🚨 TẠO BÁO CÁO NỘI DUNG VI PHẠM
 * @param {object} reportData - Dữ liệu báo cáo
 * @param {string} reportData.reportType - Loại báo cáo ("thread" hoặc "reply")
 * @param {string} reportData.targetId - ID của thread hoặc reply bị báo cáo
 * @param {string} reportData.reason - Lý do báo cáo
 * @param {string} [reportData.description] - Mô tả chi tiết
 * @returns {Promise<Object>} Báo cáo vừa tạo
 * @route POST /api/forum/reports
 */
export const createReport = async (reportData) => {
  try {
    const response = await forumApiClient.post("/reports", reportData);
    return response.data;
  } catch (error) {
    // Xử lý các lỗi cụ thể
    if (error.response?.status === 401) {
      throw new Error("Bạn cần đăng nhập để báo cáo");
    } else if (error.response?.status === 400) {
      throw new Error(
        error.response.data.message || "Dữ liệu báo cáo không hợp lệ"
      );
    } else if (error.response?.status === 429) {
      throw new Error("Bạn đã báo cáo quá nhiều. Vui lòng thử lại sau");
    } else {
      throw new Error(error.response?.data?.message || "Không thể gửi báo cáo");
    }
  }
};

/**
 * Lấy chi tiết một chủ đề bằng slug, bao gồm các replies đã phân trang.
 * @param {string} slug - Slug của chủ đề.
 * @param {object} [params] - Các tham số tùy chọn.
 * @param {number} [params.page] - Trang của danh sách trả lời.
 * @param {number} [params.limit] - Số lượng trả lời mỗi trang.
 * @returns {Promise<Object>} Đối tượng chứa chi tiết chủ đề và danh sách trả lời.
 */
export const getThreadBySlug = async (slug, { page, limit } = {}) => {
  try {
    const params = new URLSearchParams();
    if (page) params.append("page", page.toString());
    if (limit) params.append("limit", limit.toString());

    const response = await forumApiClient.get(
      `/threads/${slug}?${params.toString()}`
    );
    // Backend trả về: { success, thread, replies: { data, pagination } }
    return response.data;
  } catch (error) {
    console.error(
      `Lỗi khi lấy thread ${slug}:`,
      error.response?.data || error.message
    );
    throw error.response?.data || new Error(`Không thể lấy thread ${slug}`);
  }
};

/**
 * 🎬 TẠO THREAD VỚI MOVIE METADATA
 * @param {object} threadData - Dữ liệu thread bao gồm movieMetadata
 * @param {string} token - JWT token
 * @returns {Promise<Object>} Thread vừa tạo
 */
export const createThreadWithMovie = async (threadData, token) => {
  try {
    const response = await forumApiClient.post("/threads", threadData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error(
      "Lỗi khi tạo thread với movie:",
      error.response?.data || error.message
    );
    throw error.response?.data || new Error("Không thể tạo thread với phim");
  }
};

/**
 * 🎬 LẤY THREADS THEO MOVIE ID
 * @param {string} movieId - ID của phim
 * @param {object} [params] - Tham số query (page, limit)
 * @returns {Promise<Object>} Danh sách threads của phim
 */
export const getThreadsByMovie = async (
  movieId,
  { page = 1, limit = 15 } = {}
) => {
  try {
    const params = new URLSearchParams();
    if (page) params.append("page", page.toString());
    if (limit) params.append("limit", limit.toString());

    const response = await forumApiClient.get(
      `/threads/movie/${movieId}?${params.toString()}`
    );

    return response.data;
  } catch (error) {
    console.error("Lỗi khi lấy threads theo movie:", error);
    throw error.response?.data || new Error("Không thể lấy threads theo phim");
  }
};

/**
 * 🔥 LẤY MOVIE DISCUSSIONS TRENDING
 * @param {object} [params] - Tham số query (limit, timeframe)
 * @returns {Promise<Object>} Danh sách phim trending
 */
export const getTrendingMovieDiscussions = async ({
  limit = 10,
  timeframe = "week",
} = {}) => {
  try {
    const params = new URLSearchParams();
    if (limit) params.append("limit", limit.toString());
    if (timeframe) params.append("timeframe", timeframe);

    const response = await forumApiClient.get(
      `/movie-discussions/trending?${params.toString()}`
    );

    return response.data;
  } catch (error) {
    console.error("Lỗi khi lấy trending discussions:", error);
    throw error.response?.data || new Error("Không thể lấy thảo luận trending");
  }
};

/**
 * 🔍 SEARCH MOVIES từ API thứ 3 để gắn vào thread
 * @param {string} keyword - Từ khóa tìm kiếm
 * @returns {Promise<Object>} Danh sách phim search được
 */
export const searchMoviesForThread = async (keyword) => {
  try {
    if (!keyword || keyword.trim().length < 2) {
      return { success: true, movies: [] };
    }

    const response = await axios.get(
      `${process.env.REACT_APP_API_URL}/api/movies/search/thread`,
      {
        params: { keyword: keyword.trim() },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Lỗi khi tìm kiếm phim:", error);
    throw error.response?.data || new Error("Không thể tìm kiếm phim");
  }
};

/**
 * Soft-deletes a thread.
 * @param {string} threadId - The ID of the thread to delete.
 * @returns {Promise<Object>} Confirmation message.
 * @route DELETE /api/forum/threads/:threadId
 */
export const deleteThread = async (threadId) => {
  try {
    const response = await forumApiClient.delete(`/threads/${threadId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error("Không thể xóa chủ đề");
  }
};

/**
 * Soft-deletes a reply.
 * @param {string} replyId - The ID of the reply to delete.
 * @returns {Promise<Object>} Confirmation message.
 * @route DELETE /api/forum/replies/:replyId
 */
export const deleteReply = async (replyId) => {
  try {
    const response = await forumApiClient.delete(`/replies/${replyId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error("Không thể xóa trả lời");
  }
};

// Các hàm khác sẽ được thêm vào đây (getThreadBySlug, createThread, createReply)
