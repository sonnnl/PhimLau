import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5001/api"; // Đổi port từ 5000 sang 5001

const forumApi = axios.create({
  baseURL: `${API_URL}/forum`,
});

/**
 * Lấy tất cả danh mục forum.
 * @returns {Promise<Array<Object>>} Danh sách các danh mục.
 */
export const getCategories = async () => {
  try {
    const response = await forumApi.get("/categories");
    return response.data;
  } catch (error) {
    console.error(
      "Error fetching forum categories:",
      error.response?.data || error.message
    );
    throw error.response?.data || new Error("Could not fetch forum categories");
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
export const getThreads = async ({ categorySlug, page, limit, sort } = {}) => {
  try {
    const params = new URLSearchParams();
    if (categorySlug) params.append("category", categorySlug);
    if (page) params.append("page", page.toString());
    if (limit) params.append("limit", limit.toString());
    if (sort) params.append("sort", sort);

    const response = await forumApi.get(`/threads?${params.toString()}`);
    return response.data; // Backend trả về { success, count, pagination, category, threads }
  } catch (error) {
    console.error(
      "Error fetching forum threads:",
      error.response?.data || error.message
    );
    throw error.response?.data || new Error("Could not fetch forum threads");
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
    const response = await forumApi.post("/threads", threadData, {
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
    const response = await forumApi.post(
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

    const response = await forumApi.get(
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
