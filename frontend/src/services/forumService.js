import axios from "axios";

// ===== API CONFIGURATION =====
const BACKEND_API_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5001/api";

// Tạo axios instance riêng cho Forum API
const forumApiClient = axios.create({
  baseURL: `${BACKEND_API_URL}/forum`,
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
    return response.data;
  } catch (error) {
    console.error(
      "❌ Error fetching forum categories:",
      error.response?.data || error.message
    );
    throw error.response?.data || new Error("Không thể tải danh mục diễn đàn");
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
      "❌ Error fetching forum threads:",
      error.response?.data || error.message
    );
    throw error.response?.data || new Error("Không thể tải danh sách chủ đề");
  }
};

/**
 * Tạo một chủ đề mới.
 * @param {object} threadData - Dữ liệu của chủ đề (title, content, categoryId).
 * @param {string} token - JWT token của người dùng.
 * @returns {Promise<Object>} Chủ đề vừa tạo.
 */
export const createThread = async (threadData, token) => {
  try {
    const response = await forumApiClient.post("/threads", threadData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error(
      "Error creating new thread:",
      error.response?.data || error.message
    );
    throw error.response?.data || new Error("Could not create new thread");
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
      `Error creating reply for thread ${threadId}:`,
      error.response?.data || error.message
    );
    throw (
      error.response?.data ||
      new Error(`Could not create reply for thread ${threadId}`)
    );
  }
};

/**
 * Lấy chi tiết một chủ đề bằng slug, bao gồm các replies đã phân trang.
 * @param {string} slug - Slug của chủ đề.
 * @param {object} [params] - Các tham số tùy chọn.
 * @param {number} [params.replyPage] - Trang của danh sách trả lời.
 * @param {number} [params.replyLimit] - Số lượng trả lời mỗi trang.
 * @returns {Promise<Object>} Đối tượng chứa chi tiết chủ đề và danh sách trả lời.
 */
export const getThreadBySlug = async (slug, { replyPage, replyLimit } = {}) => {
  try {
    const params = new URLSearchParams();
    if (replyPage) params.append("replyPage", replyPage.toString());
    if (replyLimit) params.append("replyLimit", replyLimit.toString());

    const response = await forumApiClient.get(
      `/threads/${slug}?${params.toString()}`
    );
    // Backend trả về: { success, thread, replies: { items, pagination } }
    return response.data;
  } catch (error) {
    console.error(
      `Error fetching thread ${slug}:`,
      error.response?.data || error.message
    );
    throw error.response?.data || new Error(`Could not fetch thread ${slug}`);
  }
};

// Các hàm khác sẽ được thêm vào đây (getThreadBySlug, createThread, createReply)
