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

// GET /api/movies/latest
// Lấy danh sách phim mới cập nhật (trang mặc định là 1)
const getLatestMovies = async (req, res) => {
  const { page = 1 } = req.query;
  try {
    const response = await axios.get(
      `${PHIM_API_DOMAIN}/danh-sach/phim-moi-cap-nhat?page=${page}`
    );

    // Log a toàn bộ data để kiểm tra cấu trúc
    console.log(
      "API Response Data for Latest Movies:",
      JSON.stringify(response.data, null, 2)
    );

    // Kiểm tra cẩn thận hơn trước khi truy cập
    if (response.data && response.data.status && response.data.items) {
      // Giả sử pagination nằm trực tiếp trong data.params nếu params tồn tại
      // Hoặc API có thể đã thay đổi, pagination nằm ở chỗ khác hoặc có tên khác.
      const paginationData =
        response.data.params?.pagination || response.data.pagination || null;

      res.json({
        items: response.data.items,
        pagination: paginationData, // Sử dụng paginationData đã kiểm tra
        appParams: response.data.appParams, // Giữ nguyên nếu appParams vẫn đúng
      });
    } else {
      console.error(
        "Unexpected API response structure for latest movies:",
        response.data
      );
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
};

// GET /api/movies/details/:slug
// Lấy chi tiết một phim bằng slug
const getMovieDetailsBySlug = async (req, res) => {
  const { slug } = req.params;
  try {
    const response = await axios.get(`${PHIM_API_DOMAIN}/phim/${slug}`);
    // Log để kiểm tra
    // console.log(`API Response Data for Movie Details (${slug}):`, JSON.stringify(response.data, null, 2));
    if (response.data && response.data.status && response.data.movie) {
      // Get or create our local movie metadata
      const movieMetadata = await getOrCreateMovieMetadata(response.data.movie);

      res.json({
        movie: response.data.movie,
        episodes: response.data.episodes,
        appParams: response.data.appParams,
        movieMetadata: movieMetadata, // Dữ liệu metadata từ DB của chúng ta (bao gồm appRating...)
      });
    } else {
      console.error(
        `Unexpected API response for movie details ${slug}:`,
        response.data
      );
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
const searchMovies = async (req, res) => {
  const {
    keyword,
    page = 1,
    limit = 20, // Giới hạn mặc định nếu không được cung cấp
    category,
    country,
    year,
    sort_field,
    sort_type,
    sort_lang,
  } = req.query;

  // Từ khóa vẫn là bắt buộc cho endpoint /v1/api/tim-kiem của API nguồn
  // Tuy nhiên, nếu chúng ta muốn tìm kiếm nâng cao mà không cần keyword,
  // API nguồn có thể không hỗ trợ trực tiếp.
  // Tạm thời vẫn yêu cầu keyword hoặc xử lý logic nếu API nguồn cho phép keyword rỗng.
  // Theo tài liệu API: "keyword = Từ khóa bạn cần tìm kiếm."
  // Nếu không có keyword, có thể trả về lỗi hoặc không gọi API.
  // Giả sử người dùng có thể muốn tìm kiếm chỉ theo thể loại, quốc gia mà không cần keyword.
  // API /v1/api/tim-kiem có vẻ bắt buộc keyword.
  // API /v1/api/danh-sach/{type_list} thì linh hoạt hơn nhưng lại thiếu keyword.
  // Hiện tại, chúng ta sẽ bám theo /v1/api/tim-kiem và yêu cầu keyword hoặc một trường nào đó phải có.

  // Nếu không có bất kỳ tham số nào ngoài page và limit, có thể coi là không hợp lệ
  if (!keyword && !category && !country && !year && !sort_lang) {
    // return res.status(400).json({ message: "Cần ít nhất một tiêu chí tìm kiếm (từ khóa, thể loại, quốc gia, năm, hoặc ngôn ngữ)." });
    // Hoặc nếu API /tim-kiem bắt buộc keyword:
    if (!keyword) {
      return res.status(400).json({
        message: "Từ khóa tìm kiếm là bắt buộc cho loại tìm kiếm này.",
      });
    }
  }

  try {
    let apiUrl = `${PHIM_API_DOMAIN}/v1/api/tim-kiem?`;
    const queryParams = [];

    if (keyword) queryParams.push(`keyword=${encodeURIComponent(keyword)}`);
    queryParams.push(`page=${page}`);
    queryParams.push(`limit=${limit}`);
    if (category) queryParams.push(`category=${encodeURIComponent(category)}`);
    if (country) queryParams.push(`country=${encodeURIComponent(country)}`);
    if (year) queryParams.push(`year=${year}`);
    if (sort_field) queryParams.push(`sort_field=${sort_field}`);
    if (sort_type) queryParams.push(`sort_type=${sort_type}`);
    if (sort_lang) queryParams.push(`sort_lang=${sort_lang}`);

    apiUrl += queryParams.join("&");

    // console.log("Constructed API URL for advanced search:", apiUrl); // Để debug

    const response = await axios.get(apiUrl);

    if (
      response.data &&
      response.data.data &&
      response.data.data.items &&
      response.data.data.params &&
      response.data.data.params.pagination
    ) {
      res.json({
        success: true, // Thêm success flag cho nhất quán
        items: response.data.data.items,
        pagination: response.data.data.params.pagination,
        titlePage: response.data.data.titlePage, // API tìm kiếm cũng có thể có titlePage
        appParams: response.data.data.appParams,
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
};

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
      res.json({
        success: true,
        items: apiResponse.data.items,
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
      res.json({
        success: true,
        items: apiResponse.data.items,
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

    // API https://phimapi.com/the-loai trả về trực tiếp một mảng các object thể loại
    if (apiResponse && Array.isArray(apiResponse)) {
      res.json({
        success: true,
        genres: apiResponse,
      });
    } else {
      // Nếu API trả về cấu trúc khác không mong đợi
      console.error(
        "Unexpected API response structure for /the-loai. Expected an array. Received:",
        apiResponse
      );
      res.status(500).json({
        success: false,
        message:
          "Dữ liệu thể loại trả về từ API nguồn không đúng định dạng mong đợi.",
      });
    }
  } catch (error) {
    console.error(
      "Error fetching movie genres from source API:",
      error.message
    );
    if (error.response) {
      // Lỗi từ phía API nguồn (ví dụ: API nguồn bị 500, 404, etc.)
      console.error(
        "Error response data from source API:",
        error.response.data
      );
      console.error(
        "Error response status from source API:",
        error.response.status
      );
      res.status(error.response.status || 500).json({
        success: false,
        message: "Lỗi từ API nguồn khi lấy danh sách thể loại.",
        sourceError: error.response.data,
      });
    } else {
      // Lỗi mạng hoặc lỗi khác không phải từ response của API nguồn
      res.status(500).json({
        success: false,
        message: "Lỗi máy chủ nội bộ khi lấy danh sách thể loại.",
      });
    }
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

    // API https://phimapi.com/quoc-gia trả về trực tiếp một mảng các object quốc gia
    if (apiResponse && Array.isArray(apiResponse)) {
      res.json({
        success: true,
        countries: apiResponse,
      });
    } else {
      console.error(
        "Unexpected API response structure for /quoc-gia. Expected an array. Received:",
        apiResponse
      );
      res.status(500).json({
        success: false,
        message:
          "Dữ liệu quốc gia trả về từ API nguồn không đúng định dạng mong đợi.",
      });
    }
  } catch (error) {
    console.error(
      "Error fetching movie countries from source API:",
      error.message
    );
    if (error.response) {
      console.error(
        "Error response data from source API:",
        error.response.data
      );
      console.error(
        "Error response status from source API:",
        error.response.status
      );
      res.status(error.response.status || 500).json({
        success: false,
        message: "Lỗi từ API nguồn khi lấy danh sách quốc gia.",
        sourceError: error.response.data,
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Lỗi máy chủ nội bộ khi lấy danh sách quốc gia.",
      });
    }
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
};

// Cần đảm bảo các hàm cũ (getLatestMovies, getMovieDetailsBySlug, searchMovies) vẫn được export nếu chúng vẫn được sử dụng bởi các route khác.
// Nếu file này chỉ chứa các hàm mới thì chỉ cần export các hàm mới.
// Giả sử các hàm cũ vẫn còn và được export từ một nơi khác hoặc sẽ được thêm lại vào đây.
