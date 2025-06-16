import { useState, useEffect, useCallback } from "react";

/**
 * ===== CUSTOM HOOK: FORUM CATEGORIES =====
 * Hook để fetch và manage forum categories data
 * @returns {Object} { categories, loading, error, refreshCategories }
 */
export const useForumCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCategories = useCallback(async () => {
    const { fetchAllForumCategories } = await import(
      "../services/forumService"
    );

    try {
      setLoading(true);
      setError(null);
      const data = await fetchAllForumCategories();
      setCategories(data);
    } catch (err) {
      setError(err.message || "Không thể tải danh mục diễn đàn.");
      console.error("❌ Error fetching forum categories:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const refreshCategories = useCallback(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    loading,
    error,
    refreshCategories,
  };
};

/**
 * ===== CUSTOM HOOK: FORUM THREADS =====
 * Hook để fetch và manage forum threads data với pagination
 * @param {string} categorySlug - Slug của category để filter
 * @param {number} initialPage - Trang ban đầu
 * @returns {Object} { threadsData, loading, error, currentPage, fetchThreadsData, handlePageChange }
 */
export const useForumThreads = (categorySlug, initialPage = 1) => {
  const [threadsData, setThreadsData] = useState({
    threads: [],
    pagination: {},
    category: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(initialPage);

  const THREADS_PER_PAGE = 15;

  const fetchThreadsData = useCallback(
    async (pageToFetch) => {
      const { fetchForumThreadsWithFilters } = await import(
        "../services/forumService"
      );

      try {
        setLoading(true);
        setError(null);

        const data = await fetchForumThreadsWithFilters({
          categorySlug,
          page: pageToFetch,
          limit: THREADS_PER_PAGE,
        });

        setThreadsData(data);

        if (pageToFetch !== currentPage) {
          setCurrentPage(pageToFetch);
        }
      } catch (err) {
        setError(err.message || "Không thể tải danh sách chủ đề.");
        console.error("❌ Error fetching forum threads:", err);
      } finally {
        setLoading(false);
      }
    },
    [categorySlug, currentPage]
  );

  useEffect(() => {
    fetchThreadsData(initialPage);
  }, [categorySlug, initialPage, fetchThreadsData]);

  const handlePageChange = useCallback(
    (newPage) => {
      if (
        newPage >= 1 &&
        newPage <= (threadsData.pagination?.totalPages || 1)
      ) {
        fetchThreadsData(newPage);
      }
    },
    [fetchThreadsData, threadsData.pagination?.totalPages]
  );

  return {
    threadsData,
    loading,
    error,
    currentPage,
    fetchThreadsData,
    handlePageChange,
  };
};

/**
 * ===== CUSTOM HOOK: FORUM THREAD DETAIL =====
 * Hook để fetch thread detail với replies pagination
 * @param {string} threadSlug - Slug của thread
 * @param {number} initialReplyPage - Trang reply ban đầu
 * @returns {Object} { threadData, loading, error, currentReplyPage, handleReplyPageChange }
 */
export const useForumThreadDetail = (threadSlug, initialReplyPage = 1) => {
  const [threadData, setThreadData] = useState({
    thread: null,
    replies: { data: [], pagination: {} },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentReplyPage, setCurrentReplyPage] = useState(initialReplyPage);

  const REPLIES_PER_PAGE = 20;

  const fetchThreadData = useCallback(
    async (replyPageToFetch) => {
      const { getThreadBySlug } = await import("../services/forumService");

      try {
        setLoading(true);
        setError(null);

        const data = await getThreadBySlug(threadSlug, {
          page: replyPageToFetch,
          limit: REPLIES_PER_PAGE,
        });

        setThreadData(data);

        if (replyPageToFetch !== currentReplyPage) {
          setCurrentReplyPage(replyPageToFetch);
        }
      } catch (err) {
        setError(err.message || "Không thể tải chi tiết chủ đề.");
        console.error("❌ Error fetching thread detail:", err);
      } finally {
        setLoading(false);
      }
    },
    [threadSlug, currentReplyPage]
  );

  useEffect(() => {
    if (threadSlug) {
      fetchThreadData(initialReplyPage);
    }
  }, [threadSlug, initialReplyPage, fetchThreadData]);

  const handleReplyPageChange = useCallback(
    (newPage) => {
      if (
        newPage >= 1 &&
        newPage <= (threadData.replies.pagination?.totalPages || 1)
      ) {
        fetchThreadData(newPage);
      }
    },
    [fetchThreadData, threadData.replies.pagination?.totalPages]
  );

  return {
    threadData,
    loading,
    error,
    currentReplyPage,
    fetchThreadData,
    handleReplyPageChange,
  };
};
