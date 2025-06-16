/**
 * ============================================================================
 * 🚀 CACHE MANAGER - HỆ THỐNG CACHE TỔNG THỂ
 * ============================================================================
 * Quản lý tất cả cache trong hệ thống một cách tập trung và hiệu quả
 */

class CacheManager {
  constructor() {
    // 🗂️ MULTIPLE CACHE STORES cho các loại data khác nhau
    this.movieSearchCache = new Map();
    this.categoriesCache = new Map();
    this.userSessionCache = new Map();
    this.threadListCache = new Map();
    this.statisticsCache = new Map();

    // ⏰ CACHE DURATIONS (milliseconds)
    this.DURATIONS = {
      MOVIE_SEARCH: 5 * 60 * 1000, // 5 phút - API expensive
      CATEGORIES: 30 * 60 * 1000, // 30 phút - ít thay đổi
      USER_SESSION: 15 * 60 * 1000, // 15 phút - user data
      THREAD_LIST: 60 * 1000, // 1 phút - thay đổi thường xuyên
      STATISTICS: 10 * 60 * 1000, // 10 phút - dashboard stats
      SHORT_TERM: 1 * 60 * 1000, // 1 phút - temporary data
      LONG_TERM: 60 * 60 * 1000, // 1 giờ - stable data
    };

    // 🧹 AUTO CLEANUP - Tự động dọn dẹp cache expired
    this.startCleanupInterval();

    console.log("CacheManager initialized with multiple stores");
  }

  // ===== 🎬 MOVIE SEARCH CACHE =====

  /**
   * Get cached movie search results
   * @param {string} keyword - Search keyword
   * @returns {Object|null} Cached data or null
   */
  getMovieSearch(keyword) {
    const normalizedKey = this.normalizeKey(keyword);
    const cacheKey = `search_${normalizedKey}`;
    return this.getCacheItem(
      this.movieSearchCache,
      cacheKey,
      this.DURATIONS.MOVIE_SEARCH
    );
  }

  /**
   * Set movie search cache
   * @param {string} keyword - Search keyword
   * @param {Object} data - Data to cache
   */
  setMovieSearch(keyword, data) {
    const normalizedKey = this.normalizeKey(keyword);
    const cacheKey = `search_${normalizedKey}`;
    this.setCacheItem(this.movieSearchCache, cacheKey, {
      ...data,
      _cacheMetadata: {
        type: "movie_search",
        keyword: normalizedKey,
        cachedAt: new Date().toISOString(),
      },
    });
    console.log(`Cached movie search: "${normalizedKey}"`);
  }

  // ===== 🗂️ CATEGORIES CACHE =====

  /**
   * Get cached forum categories
   * @returns {Array|null} Cached categories or null
   */
  getCategories() {
    return this.getCacheItem(
      this.categoriesCache,
      "forum_categories",
      this.DURATIONS.CATEGORIES
    );
  }

  /**
   * Set forum categories cache
   * @param {Array} categories - Categories data
   */
  setCategories(categories) {
    this.setCacheItem(this.categoriesCache, "forum_categories", {
      data: categories,
      _cacheMetadata: {
        type: "forum_categories",
        count: categories.length,
        cachedAt: new Date().toISOString(),
      },
    });
    console.log(`📦 Cached ${categories.length} forum categories`);
  }

  /**
   * Invalidate categories cache when updated
   */
  invalidateCategories() {
    this.categoriesCache.delete("forum_categories");
    console.log("🗑️ Invalidated categories cache");
  }

  // ===== 👤 USER SESSION CACHE =====

  /**
   * Get user session data
   * @param {string} userId - User ID
   * @returns {Object|null} Cached user data or null
   */
  getUserSession(userId) {
    const cacheKey = `user_${userId}`;
    return this.getCacheItem(
      this.userSessionCache,
      cacheKey,
      this.DURATIONS.USER_SESSION
    );
  }

  /**
   * Set user session cache
   * @param {string} userId - User ID
   * @param {Object} userData - User data to cache
   */
  setUserSession(userId, userData) {
    const cacheKey = `user_${userId}`;
    this.setCacheItem(this.userSessionCache, cacheKey, {
      ...userData,
      _cacheMetadata: {
        type: "user_session",
        userId,
        cachedAt: new Date().toISOString(),
      },
    });
    console.log(`📦 Cached user session: ${userId}`);
  }

  /**
   * Invalidate user session when user data changes
   * @param {string} userId - User ID
   */
  invalidateUserSession(userId) {
    const cacheKey = `user_${userId}`;
    this.userSessionCache.delete(cacheKey);
    console.log(`🗑️ Invalidated user session: ${userId}`);
  }

  // ===== 💬 THREAD LIST CACHE =====

  /**
   * Get cached thread list
   * @param {Object} filters - Query filters
   * @returns {Object|null} Cached threads or null
   */
  getThreadList(filters) {
    const cacheKey = this.generateThreadListKey(filters);
    return this.getCacheItem(
      this.threadListCache,
      cacheKey,
      this.DURATIONS.THREAD_LIST
    );
  }

  /**
   * Set thread list cache
   * @param {Object} filters - Query filters
   * @param {Object} data - Thread list data
   */
  setThreadList(filters, data) {
    const cacheKey = this.generateThreadListKey(filters);
    this.setCacheItem(this.threadListCache, cacheKey, {
      ...data,
      _cacheMetadata: {
        type: "thread_list",
        filters,
        cachedAt: new Date().toISOString(),
      },
    });
    console.log(`📦 Cached thread list: ${cacheKey}`);
  }

  /**
   * Invalidate thread list cache when threads change
   */
  invalidateThreadList() {
    this.threadListCache.clear();
    console.log("🗑️ Invalidated all thread list cache");
  }

  // ===== 📊 STATISTICS CACHE =====

  /**
   * Get cached statistics
   * @param {string} type - Type of statistics
   * @returns {Object|null} Cached stats or null
   */
  getStatistics(type) {
    const cacheKey = `stats_${type}`;
    return this.getCacheItem(
      this.statisticsCache,
      cacheKey,
      this.DURATIONS.STATISTICS
    );
  }

  /**
   * Set statistics cache
   * @param {string} type - Type of statistics
   * @param {Object} data - Statistics data
   */
  setStatistics(type, data) {
    const cacheKey = `stats_${type}`;
    this.setCacheItem(this.statisticsCache, cacheKey, {
      ...data,
      _cacheMetadata: {
        type: "statistics",
        statsType: type,
        cachedAt: new Date().toISOString(),
      },
    });
    console.log(`📦 Cached statistics: ${type}`);
  }

  // ===== 🛠️ CORE CACHE METHODS =====

  /**
   * Generic get cache item with expiration check
   */
  getCacheItem(store, key, duration) {
    const item = store.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > duration) {
      store.delete(key);
      return null;
    }

    return item.data;
  }

  /**
   * Generic set cache item with timestamp
   */
  setCacheItem(store, key, data) {
    store.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Normalize cache key (lowercase, trim, special chars)
   */
  normalizeKey(key) {
    return key
      .toString()
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "");
  }

  /**
   * Generate cache key for thread list based on filters
   */
  generateThreadListKey(filters) {
    const keyParts = [
      filters.category || "all",
      filters.status || "all",
      filters.moderation || "all",
      filters.page || 1,
      filters.limit || 20,
    ];
    return `threads_${keyParts.join("_")}`;
  }

  // ===== 🧹 CACHE MANAGEMENT =====

  /**
   * Start automatic cleanup interval
   */
  startCleanupInterval() {
    // Cleanup every 5 minutes
    setInterval(() => {
      this.cleanupExpiredCache();
    }, 5 * 60 * 1000);
  }

  /**
   * Clean up expired cache entries
   */
  cleanupExpiredCache() {
    const stores = [
      {
        store: this.movieSearchCache,
        name: "movieSearch",
        duration: this.DURATIONS.MOVIE_SEARCH,
      },
      {
        store: this.categoriesCache,
        name: "categories",
        duration: this.DURATIONS.CATEGORIES,
      },
      {
        store: this.userSessionCache,
        name: "userSession",
        duration: this.DURATIONS.USER_SESSION,
      },
      {
        store: this.threadListCache,
        name: "threadList",
        duration: this.DURATIONS.THREAD_LIST,
      },
      {
        store: this.statisticsCache,
        name: "statistics",
        duration: this.DURATIONS.STATISTICS,
      },
    ];

    let totalCleaned = 0;

    stores.forEach(({ store, name, duration }) => {
      const beforeSize = store.size;

      for (const [key, item] of store.entries()) {
        if (Date.now() - item.timestamp > duration) {
          store.delete(key);
          totalCleaned++;
        }
      }

      const afterSize = store.size;
      if (beforeSize > afterSize) {
        console.log(
          `🧹 Cleaned ${
            beforeSize - afterSize
          } expired entries from ${name} cache`
        );
      }
    });

    if (totalCleaned > 0) {
      console.log(
        `🧹 Cache cleanup completed: ${totalCleaned} total entries removed`
      );
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      movieSearch: {
        size: this.movieSearchCache.size,
        duration: this.DURATIONS.MOVIE_SEARCH / 1000 + "s",
      },
      categories: {
        size: this.categoriesCache.size,
        duration: this.DURATIONS.CATEGORIES / 1000 + "s",
      },
      userSession: {
        size: this.userSessionCache.size,
        duration: this.DURATIONS.USER_SESSION / 1000 + "s",
      },
      threadList: {
        size: this.threadListCache.size,
        duration: this.DURATIONS.THREAD_LIST / 1000 + "s",
      },
      statistics: {
        size: this.statisticsCache.size,
        duration: this.DURATIONS.STATISTICS / 1000 + "s",
      },
      totalEntries:
        this.movieSearchCache.size +
        this.categoriesCache.size +
        this.userSessionCache.size +
        this.threadListCache.size +
        this.statisticsCache.size,
    };
  }

  /**
   * Clear all caches
   */
  clearAllCache() {
    this.movieSearchCache.clear();
    this.categoriesCache.clear();
    this.userSessionCache.clear();
    this.threadListCache.clear();
    this.statisticsCache.clear();
    console.log("All caches cleared");
  }

  /**
   * Clear specific cache store
   */
  clearCache(type) {
    const stores = {
      movieSearch: this.movieSearchCache,
      categories: this.categoriesCache,
      userSession: this.userSessionCache,
      threadList: this.threadListCache,
      statistics: this.statisticsCache,
    };

    if (stores[type]) {
      stores[type].clear();
      console.log(`${type} cache cleared`);
    }
  }
}

// 🌟 EXPORT SINGLETON INSTANCE
const cacheManager = new CacheManager();
export default cacheManager;
