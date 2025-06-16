/**
 * ============================================================================
 * 🚀 CACHE MIDDLEWARE - EXPRESS CACHING LAYER
 * ============================================================================
 * Middleware tự động cache response cho Express routes
 */

import cacheManager from "../utils/cacheManager.js";

/**
 * Generic cache middleware factory
 * @param {string} cacheType - Type of cache (movieSearch, categories, etc.)
 * @param {number} duration - Cache duration in milliseconds (optional)
 * @param {function} keyGenerator - Function to generate cache key from req
 */
const createCacheMiddleware = (
  cacheType,
  duration = null,
  keyGenerator = null
) => {
  return (req, res, next) => {
    // Generate cache key
    let cacheKey;
    if (keyGenerator && typeof keyGenerator === "function") {
      cacheKey = keyGenerator(req);
    } else {
      // Default key generation
      cacheKey = `${req.method}_${req.originalUrl}_${JSON.stringify(
        req.query
      )}`;
    }

    // Try to get from cache
    let cachedData;
    switch (cacheType) {
      case "categories":
        cachedData = cacheManager.getCategories();
        break;
      case "movieSearch":
        cachedData = cacheManager.getMovieSearch(req.query.q || "");
        break;
      case "threadList":
        cachedData = cacheManager.getThreadList(req.query);
        break;
      case "statistics":
        cachedData = cacheManager.getStatistics(req.params.type || "dashboard");
        break;
      default:
        cachedData = null;
    }

    if (cachedData) {
      console.log(`⚡ Cache hit for ${cacheType}: ${cacheKey}`);

      // 🔧 FIX: Ensure consistent response format based on cache type
      let responseData;
      switch (cacheType) {
        case "categories":
          responseData = {
            success: true,
            data: cachedData.data || cachedData, // Handle both wrapped and unwrapped data
          };
          break;
        default:
          responseData = cachedData;
      }

      return res.json({
        ...responseData,
        _fromCache: true,
        _cacheType: cacheType,
        _cacheKey: cacheKey,
      });
    }

    // If no cache, continue to controller
    console.log(`Cache miss for ${cacheType}: ${cacheKey}`);

    // Store original res.json to intercept response
    const originalJson = res.json;
    res.json = function (data) {
      // Cache the response data based on type
      try {
        switch (cacheType) {
          case "categories":
            if (data.data && Array.isArray(data.data)) {
              cacheManager.setCategories(data.data);
            }
            break;
          case "movieSearch":
            if (req.query.q && data.movies) {
              cacheManager.setMovieSearch(req.query.q, data);
            }
            break;
          case "threadList":
            if (data.threads) {
              cacheManager.setThreadList(req.query, data);
            }
            break;
          case "statistics":
            if (data.success) {
              cacheManager.setStatistics(req.params.type || "dashboard", data);
            }
            break;
        }
        console.log(`📦 Cached response for ${cacheType}: ${cacheKey}`);
      } catch (error) {
        console.error(`❌ Failed to cache ${cacheType}:`, error.message);
      }

      // Call original json method
      return originalJson.call(this, {
        ...data,
        _fromCache: false,
        _cacheType: cacheType,
      });
    };

    next();
  };
};

/**
 * Specific middleware for different cache types
 */

// Categories cache middleware
export const cacheCategories = createCacheMiddleware("categories");

// Movie search cache middleware
export const cacheMovieSearch = createCacheMiddleware(
  "movieSearch",
  null,
  (req) => {
    return `search_${req.query.q || ""}`;
  }
);

// Thread list cache middleware
export const cacheThreadList = createCacheMiddleware(
  "threadList",
  null,
  (req) => {
    const { category, page = 1, limit = 15 } = req.query;
    return `threads_${category || "all"}_${page}_${limit}`;
  }
);

// Statistics cache middleware
export const cacheStatistics = createCacheMiddleware(
  "statistics",
  null,
  (req) => {
    return `stats_${req.params.type || "dashboard"}`;
  }
);

/**
 * Cache invalidation middleware
 * Sử dụng sau khi create/update/delete data
 */
export const invalidateCache = (cacheTypes = []) => {
  return (req, res, next) => {
    // Store original methods to add cache invalidation
    const originalJson = res.json;
    const originalSend = res.send;

    const invalidateCaches = () => {
      cacheTypes.forEach((type) => {
        try {
          // 🚀 REFACTORED: Sử dụng hàm clearCache chung để đảm bảo tính nhất quán
          cacheManager.clearCache(type);
          console.log(`🗑️ Invalidated cache: ${type}`);
        } catch (error) {
          console.error(`❌ Failed to invalidate ${type}:`, error.message);
        }
      });
    };

    // Override response methods
    res.json = function (data) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        invalidateCaches();
      }
      return originalJson.call(this, data);
    };

    res.send = function (data) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        invalidateCaches();
      }
      return originalSend.call(this, data);
    };

    next();
  };
};

/**
 * Cache statistics middleware
 * Thêm cache stats vào response headers
 */
export const addCacheStats = (req, res, next) => {
  const stats = cacheManager.getCacheStats();

  res.set({
    "X-Cache-Stats": JSON.stringify({
      totalEntries: stats.totalEntries,
      movieSearch: stats.movieSearch.size,
      categories: stats.categories.size,
      threadList: stats.threadList.size,
    }),
    "X-Cache-Performance": "optimized",
  });

  next();
};

/**
 * HTTP Cache headers middleware
 */
export const setHTTPCache = (maxAge = 300, type = "public") => {
  return (req, res, next) => {
    res.set({
      "Cache-Control": `${type}, max-age=${maxAge}`,
      Vary: "Accept-Encoding",
      ETag: `"${Date.now()}-${req.originalUrl}"`,
    });
    next();
  };
};

/**
 * Conditional cache middleware based on user role
 */
export const conditionalCache = (cacheType, condition = () => true) => {
  return (req, res, next) => {
    if (condition(req)) {
      return createCacheMiddleware(cacheType)(req, res, next);
    }
    next();
  };
};

// Example usage:
// router.get('/categories', cacheCategories, getForumCategories);
// router.get('/threads', cacheThreadList, getForumThreadsWithPagination);
// router.post('/threads', invalidateCache(['threadList', 'statistics']), createThread);
// router.get('/search', cacheMovieSearch, searchMoviesForThread);
