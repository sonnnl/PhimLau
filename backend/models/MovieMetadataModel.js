import mongoose from "mongoose";

const movieMetadataSchema = new mongoose.Schema(
  {
    // _id sẽ là movieId (chuỗi string) từ API phimapi.com
    // Chúng ta sẽ gán giá trị này một cách tường minh khi tạo document, không dùng ObjectId mặc định của Mongoose
    _id: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: [true, "Movie slug is required"],
      unique: true, // Đảm bảo slug là duy nhất trên hệ thống của bạn
      trim: true,
    },
    name: {
      type: String,
      required: [true, "Movie name is required"],
      trim: true,
    },
    originName: {
      type: String,
      trim: true,
    },
    posterUrl: {
      type: String,
      trim: true,
    },
    thumbUrl: {
      type: String,
      trim: true,
    },
    year: {
      type: Number,
      index: true, // Thường xuyên lọc theo năm
    },
    type: {
      // Ví dụ: 'single', 'series', 'hoathinh', 'tvshows' (đồng bộ với API phim)
      type: String,
      trim: true,
      index: true,
    },
    category: [
      {
        name: String,
        slug: String,
      },
    ], // Thể loại
    // country: [{ name: String, slug: String }], // Quốc gia
    // duration: String, // Thời lượng
    // quality: String, // Chất lượng
    // lang: String, // Ngôn ngữ

    // Các trường thống kê của riêng ứng dụng
    // Sẽ được cập nhật thông qua logic ứng dụng (ví dụ: khi người dùng yêu thích, bình luận)
    appTotalFavorites: {
      type: Number,
      default: 0,
      min: 0,
    },
    appTotalViews: {
      type: Number,
      default: 0,
      min: 0,
    },
    appAverageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5, // Đổi thành thang điểm 5
    },
    appRatingCount: {
      // Số lượng đánh giá trên hệ thống của bạn
      type: Number,
      default: 0,
      min: 0,
    },
    lastAccessedByApp: {
      // Thời điểm dữ liệu này được đồng bộ/truy cập lần cuối bởi app của bạn
      // Có thể dùng để quyết định khi nào cần refresh dữ liệu từ API gốc
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // Tự động thêm createdAt và updatedAt
  }
);

// Đảm bảo _id là duy nhất (nếu không khai báo unique: true ở trên)
// movieMetadataSchema.index({ _id: 1 }, { unique: true });

const MovieMetadata = mongoose.model("MovieMetadata", movieMetadataSchema);

export default MovieMetadata;
