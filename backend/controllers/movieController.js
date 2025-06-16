import axios from "axios";
import asyncHandler from "express-async-handler";
import MovieMetadata from "../models/MovieMetadataModel.js"; // Import MovieMetadataModel

const PHIM_API_DOMAIN = "https://phimapi.com";

// Helper function to get or create movie metadata in our DB
const getOrCreateMovieMetadata = async (movieDataFromApi) => {
  if (!movieDataFromApi || !movieDataFromApi._id) {
    console.error(
      "Invalid movieDataFromApi provided to getOrCreateMovieMetadata"
    );
    return null;
  }

  try {
    let movieMetadata = await MovieMetadata.findById(movieDataFromApi._id);

    if (movieMetadata) {
      // Movie exists, update lastAccessedByApp or other relevant fields if needed
      movieMetadata.lastAccessedByApp = Date.now();
      // You might want to update other fields if they can change in the source API
      // Ví dụ: movieMetadata.name = movieDataFromApi.name;
      await movieMetadata.save();
    } else {
      // Movie does not exist, create it
      movieMetadata = new MovieMetadata({
        _id: movieDataFromApi._id, // Quan trọng: dùng _id từ API phim làm _id của chúng ta
        slug: movieDataFromApi.slug,
        name: movieDataFromApi.name,
        originName: movieDataFromApi.origin_name || movieDataFromApi.name, // Fallback
        posterUrl: movieDataFromApi.poster_url,
        thumbUrl: movieDataFromApi.thumb_url,
        year: movieDataFromApi.year,
        type: movieDataFromApi.type,
        // Các trường khác bạn muốn cache từ API phim có thể thêm ở đây
        // appAverageRating, appRatingCount sẽ có default là 0
        lastAccessedByApp: Date.now(),
      });
      await movieMetadata.save();
    }
    return movieMetadata;
  } catch (error) {
    console.error(
      `Error in getOrCreateMovieMetadata for movieId ${movieDataFromApi._id}:`,
      error
    );
    // Không nên để lỗi này dừng toàn bộ request, có thể trả về null và xử lý ở nơi gọi
    return null;
  }
};

/**
 * Lấy danh sách phim mới cập nhật với phân trang
 * @route GET /api/movies/latest
 * @param {number} page - Số trang (mặc định = 1)
 * @param {number} limit - Số lượng phim trên mỗi trang (mặc định = 18)
 * @returns {Object} Danh sách phim với metadata và thông tin phân trang
 */
const getLatestMovies = asyncHandler(async (req, res) => {
  const { page = 1, limit = 18 } = req.query;
  try {
    // Gọi API bên ngoài để lấy danh sách phim mới
    const response = await axios.get(
      `${PHIM_API_DOMAIN}/danh-sach/phim-moi-cap-nhat?page=${page}&limit=${limit}`
    );

    // Kiểm tra cấu trúc response từ API
    if (response.data && response.data.status && response.data.items) {
      // Bổ sung metadata từ database local (ratings, reviews)
      const moviesWithMetadata = await Promise.all(
        response.data.items.map(async (movie) => {
          try {
            // Tìm metadata từ database local
            const movieMetadata = await MovieMetadata.findById(movie._id);
            return {
              ...movie,
              movieMetadata: movieMetadata || {
                appAverageRating: 0,
                appRatingCount: 0,
              },
            };
          } catch (err) {
            // Nếu lỗi, trả về movie không có metadata
            return {
              ...movie,
              movieMetadata: {
                appAverageRating: 0,
                appRatingCount: 0,
              },
            };
          }
        })
      );

      // Xử lý thông tin phân trang từ API response
      const paginationData =
        response.data.params?.pagination || response.data.pagination || null;

      res.json({
        items: moviesWithMetadata,
        pagination: paginationData,
        appParams: response.data.appParams,
      });
    } else {
      // API response không đúng cấu trúc mong đợi
      res.status(404).json({
        message:
          "Không tìm thấy dữ liệu phim mới cập nhật hoặc cấu trúc API thay đổi.",
      });
    }
  } catch (error) {
    console.error("Error fetching latest movies:", error.message);
    if (error.response) {
      console.error("Error response data:", error.response.data);
      console.error("Error response status:", error.response.status);
    }
    res.status(500).json({ message: "Lỗi máy chủ khi lấy dữ liệu phim." });
  }
});

/**
 * Lấy chi tiết phim theo slug
 * @route GET /api/movies/details/:slug
 * @param {string} slug - Slug của phim
 * @returns {Object} Thông tin chi tiết phim, episodes và metadata
 */
const getMovieDetailsBySlug = async (req, res) => {
  const { slug } = req.params;
  try {
    // Gọi API bên ngoài để lấy chi tiết phim
    const response = await axios.get(`${PHIM_API_DOMAIN}/phim/${slug}`);

    if (response.data && response.data.status && response.data.movie) {
      // Lấy hoặc tạo metadata từ database local
      const movieMetadata = await getOrCreateMovieMetadata(response.data.movie);

      res.json({
        movie: response.data.movie,
        episodes: response.data.episodes,
        appParams: response.data.appParams,
        movieMetadata: movieMetadata, // Metadata từ database local (ratings, reviews)
      });
    } else {
      res.status(404).json({
        message: "Không tìm thấy thông tin phim hoặc cấu trúc API thay đổi.",
      });
    }
  } catch (error) {
    console.error(
      `Error fetching movie details for slug ${slug}:`,
      error.message
    );
    if (error.response) {
      console.error("Error response data:", error.response.data);
      console.error("Error response status:", error.response.status);
    }
    res.status(500).json({ message: "Lỗi máy chủ khi lấy chi tiết phim." });
  }
};

// GET /api/movies/search
// Tìm kiếm phim theo từ khóa (trang mặc định là 1)
// Đã nâng cấp để hỗ trợ tìm kiếm nâng cao với nhiều tham số
const searchMovies = asyncHandler(async (req, res) => {
  const {
    keyword,
    page = 1,
    limit = 18, // Đổi limit mặc định cho nhất quán
    category,
    country,
    year,
    sort_field,
    sort_type,
  } = req.query;

  // Nếu không có bất kỳ tham số nào, trả về lỗi
  if (!keyword && !category && !country && !year) {
    return res.status(400).json({
      success: false,
      message: "Cần ít nhất một tiêu chí tìm kiếm.",
    });
  }

  try {
    // API /tim-kiem yêu cầu keyword. Nếu không có keyword nhưng có các bộ lọc khác,
    // chúng ta sẽ dùng một mẹo: tìm kiếm với keyword rỗng và bộ lọc.
    // Nếu API không cho phép, ta cần tìm một API khác (ví dụ /danh-sach)
    // Hoặc có thể gọi API /danh-sach/{type} nếu chỉ có một bộ lọc.
    // Hiện tại, chúng ta thử chiến lược gọi /tim-kiem
    let apiUrl = `${PHIM_API_DOMAIN}/v1/api/tim-kiem?`;
    const queryParams = [];

    // Luôn gửi keyword, dù là rỗng, vì API có thể yêu cầu
    queryParams.push(`keyword=${encodeURIComponent(keyword || "")}`);
    queryParams.push(`page=${page}`);
    queryParams.push(`limit=${limit}`);
    if (category) queryParams.push(`category=${encodeURIComponent(category)}`);
    if (country) queryParams.push(`country=${encodeURIComponent(country)}`);
    if (year) queryParams.push(`year=${year}`);
    if (sort_field) queryParams.push(`sort_field=${sort_field}`);
    if (sort_type) queryParams.push(`sort_type=${sort_type}`);

    apiUrl += queryParams.join("&");

    // console.log("Constructed API URL for advanced search:", apiUrl); // Để debug

    const { data: response } = await axios.get(apiUrl);

    if (
      response &&
      response.data &&
      response.data.items &&
      response.data.params &&
      response.data.params.pagination
    ) {
      // Enrich search results with local movie metadata (ratings)
      const moviesWithMetadata = await Promise.all(
        response.data.items.map(async (movie) => {
          try {
            // Try to get metadata from local database
            const movieMetadata = await MovieMetadata.findById(movie._id);
            return {
              ...movie,
              movieMetadata: movieMetadata || {
                appAverageRating: 0,
                appRatingCount: 0,
              },
            };
          } catch (err) {
            // If error, return movie without metadata
            return {
              ...movie,
              movieMetadata: {
                appAverageRating: 0,
                appRatingCount: 0,
              },
            };
          }
        })
      );

      res.json({
        success: true, // Thêm success flag cho nhất quán
        items: moviesWithMetadata,
        pagination: response.data.params.pagination,
        titlePage: response.data.titlePage, // API tìm kiếm cũng có thể có titlePage
        appParams: response.data.appParams,
      });
    } else {
      console.error(
        `Unexpected API response for advanced search with query ${JSON.stringify(
          req.query
        )}:`,
        response.data
      );
      res.status(404).json({
        success: false,
        message: "Không tìm thấy phim nào phù hợp hoặc cấu trúc API thay đổi.",
      });
    }
  } catch (error) {
    console.error(
      `Error during advanced search with query ${JSON.stringify(req.query)}:`,
      error.message
    );
    if (error.response) {
      console.error("Error response data:", error.response.data);
      console.error("Error response status:", error.response.status);
      res.status(error.response.status || 500).json({
        success: false,
        message:
          error.response.data?.message || "Lỗi từ API nguồn khi tìm kiếm phim.",
        sourceError: error.response.data,
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Lỗi máy chủ khi tìm kiếm phim.",
      });
    }
  }
});

// @desc    Fetch single movies (phim lẻ)
// @route   GET /api/movies/single
// @access  Public
const getSingleMovies = asyncHandler(async (req, res) => {
  const page = req.query.page || 1;
  try {
    const { data: apiResponse } = await axios.get(
      `${PHIM_API_DOMAIN}/v1/api/danh-sach/phim-le?page=${page}`
    );
    // API trả về: { status, msg, data: { items, params: { pagination } } }
    if (
      apiResponse &&
      apiResponse.status === "success" &&
      apiResponse.data &&
      apiResponse.data.items
    ) {
      // Enrich single movies with local movie metadata (ratings)
      const moviesWithMetadata = await Promise.all(
        apiResponse.data.items.map(async (movie) => {
          try {
            // Try to get metadata from local database
            const movieMetadata = await MovieMetadata.findById(movie._id);
            return {
              ...movie,
              movieMetadata: movieMetadata || {
                appAverageRating: 0,
                appRatingCount: 0,
              },
            };
          } catch (err) {
            // If error, return movie without metadata
            return {
              ...movie,
              movieMetadata: {
                appAverageRating: 0,
                appRatingCount: 0,
              },
            };
          }
        })
      );

      res.json({
        success: true,
        items: moviesWithMetadata,
        pagination: apiResponse.data.params?.pagination, // Lấy pagination từ data.params
        titlePage: apiResponse.data.titlePage, // Có thể thêm titlePage nếu frontend cần
      });
    } else {
      res.status(404).json({
        success: false,
        message:
          apiResponse.msg ||
          "Không tìm thấy dữ liệu phim lẻ hoặc cấu trúc API thay đổi.",
      });
    }
  } catch (error) {
    console.error("Error fetching single movies:", error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      message:
        error.response?.data?.message ||
        error.message ||
        "Server error while fetching single movies",
    });
  }
});

// @desc    Fetch series movies (phim bộ)
// @route   GET /api/movies/series
// @access  Public
const getSeriesMovies = asyncHandler(async (req, res) => {
  const page = req.query.page || 1;
  try {
    const { data: apiResponse } = await axios.get(
      `${PHIM_API_DOMAIN}/v1/api/danh-sach/phim-bo?page=${page}`
    );
    if (
      apiResponse &&
      apiResponse.status === "success" &&
      apiResponse.data &&
      apiResponse.data.items
    ) {
      // Enrich series movies with local movie metadata (ratings)
      const moviesWithMetadata = await Promise.all(
        apiResponse.data.items.map(async (movie) => {
          try {
            // Try to get metadata from local database
            const movieMetadata = await MovieMetadata.findById(movie._id);
            return {
              ...movie,
              movieMetadata: movieMetadata || {
                appAverageRating: 0,
                appRatingCount: 0,
              },
            };
          } catch (err) {
            // If error, return movie without metadata
            return {
              ...movie,
              movieMetadata: {
                appAverageRating: 0,
                appRatingCount: 0,
              },
            };
          }
        })
      );

      res.json({
        success: true,
        items: moviesWithMetadata,
        pagination: apiResponse.data.params?.pagination,
        titlePage: apiResponse.data.titlePage,
      });
    } else {
      res.status(404).json({
        success: false,
        message:
          apiResponse.msg ||
          "Không tìm thấy dữ liệu phim bộ hoặc cấu trúc API thay đổi.",
      });
    }
  } catch (error) {
    console.error("Error fetching series movies:", error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      message:
        error.response?.data?.message ||
        error.message ||
        "Server error while fetching series movies",
    });
  }
});

// @desc    Fetch movie genres
// @route   GET /api/movies/genres
// @access  Public
const getMovieGenres = asyncHandler(async (req, res) => {
  try {
    const { data: apiResponse } = await axios.get(
      `${PHIM_API_DOMAIN}/the-loai`
    );

    if (apiResponse && Array.isArray(apiResponse)) {
      res.json({
        success: true,
        items: apiResponse, // Đổi 'genres' thành 'items' cho nhất quán
      });
    } else {
      console.error(
        "Unexpected API response structure for /the-loai:",
        apiResponse
      );
      res.status(500).json({
        success: false,
        message: "Dữ liệu thể loại không đúng định dạng.",
      });
    }
  } catch (error) {
    console.error("Error fetching movie genres:", error.message);
    res.status(500).json({
      success: false,
      message: "Lỗi máy chủ khi lấy danh sách thể loại.",
    });
  }
});

// @desc    Fetch movie countries
// @route   GET /api/movies/countries
// @access  Public
const getMovieCountries = asyncHandler(async (req, res) => {
  try {
    const { data: apiResponse } = await axios.get(
      `${PHIM_API_DOMAIN}/quoc-gia`
    );

    if (apiResponse && Array.isArray(apiResponse)) {
      res.json({
        success: true,
        items: apiResponse, // Đổi 'countries' thành 'items' cho nhất quán
      });
    } else {
      console.error(
        "Unexpected API response structure for /quoc-gia:",
        apiResponse
      );
      res.status(500).json({
        success: false,
        message: "Dữ liệu quốc gia không đúng định dạng.",
      });
    }
  } catch (error) {
    console.error("Error fetching movie countries:", error.message);
    res.status(500).json({
      success: false,
      message: "Lỗi máy chủ khi lấy danh sách quốc gia.",
    });
  }
});

// @desc    Fetch movies by genre
// @route   GET /api/movies/genre/:slug
// @access  Public
const getMoviesByGenre = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const { page = 1, limit = 18 } = req.query; // Đặt mặc định là 18 cho nhất quán

  try {
    const apiUrl = `${PHIM_API_DOMAIN}/v1/api/the-loai/${slug}?page=${page}&limit=${limit}`;
    const { data: apiResponse } = await axios.get(apiUrl);

    if (
      apiResponse &&
      apiResponse.status === "success" &&
      apiResponse.data &&
      apiResponse.data.items
    ) {
      // Bổ sung metadata từ DB
      const moviesWithMetadata = await Promise.all(
        apiResponse.data.items.map(async (movie) => {
          try {
            const movieMetadata = await MovieMetadata.findById(movie._id);
            return {
              ...movie,
              movieMetadata: movieMetadata || {
                appAverageRating: 0,
                appRatingCount: 0,
              },
            };
          } catch (err) {
            console.error(
              `Error fetching metadata for movie ${movie._id} in genre list:`,
              err
            );
            return {
              ...movie,
              movieMetadata: { appAverageRating: 0, appRatingCount: 0 },
            };
          }
        })
      );

      res.json({
        success: true,
        items: moviesWithMetadata,
        pagination: apiResponse.data.params?.pagination,
        titlePage: apiResponse.data.titlePage,
        breadCrumb: apiResponse.data.breadCrumb,
      });
    } else {
      res.status(404).json({
        success: false,
        message:
          apiResponse.msg ||
          "Không tìm thấy dữ liệu phim cho thể loại này hoặc cấu trúc API thay đổi.",
      });
    }
  } catch (error) {
    console.error(`Error fetching movies for genre ${slug}:`, error.message);
    if (error.response) {
      console.error("Error response data:", error.response.data);
      console.error("Error response status:", error.response.status);
    }
    res
      .status(500)
      .json({ success: false, message: "Lỗi máy chủ khi lấy dữ liệu." });
  }
});

export {
  getLatestMovies,
  getMovieDetailsBySlug,
  searchMovies,
  getSingleMovies,
  getSeriesMovies,
  getMovieGenres,
  getMovieCountries,
  getMoviesByGenre,
};

// Cần đảm bảo các hàm cũ (getLatestMovies, getMovieDetailsBySlug, searchMovies) vẫn được export nếu chúng vẫn được sử dụng bởi các route khác.
// Nếu file này chỉ chứa các hàm mới thì chỉ cần export các hàm mới.
// Giả sử các hàm cũ vẫn còn và được export từ một nơi khác hoặc sẽ được thêm lại vào đây.
