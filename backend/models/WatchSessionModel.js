import mongoose from "mongoose";

const watchSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Tham chiếu đến UserModel
      required: [true, "User is required for a watch session"],
    },
    movie: {
      type: String, // Sẽ lưu _id (movieId từ API phim) của MovieMetadataModel
      ref: "MovieMetadata", // Tham chiếu đến MovieMetadataModel
      required: [true, "Movie is required for a watch session"],
    },
    episodeSlug: {
      // Slug của tập phim cụ thể, ví dụ: 'tap-1', 'tap-2', hoặc một ID duy nhất của tập nếu API cung cấp
      // Đối với phim lẻ, trường này có thể không cần thiết hoặc có một giá trị mặc định.
      type: String,
      trim: true,
    },
    serverName: {
      // Tên server phim đã xem, ví dụ: 'Server Vietsub #1', 'Server Thuyết Minh'
      // Thông tin này lấy từ API phim khi người dùng chọn server để xem
      type: String,
      trim: true,
    },
    lastWatchedAt: {
      // Thời điểm cuối cùng người dùng xem/tương tác với tập này
      type: Date,
      default: Date.now,
      index: true, // Để dễ dàng lấy lịch sử xem gần nhất
    },
  },
  {
    timestamps: true, // Tự động thêm createdAt (khi bắt đầu xem tập này lần đầu) và updatedAt (khi cập nhật tiến độ)
  }
);

// Tạo index để tối ưu hóa việc truy vấn lịch sử xem của người dùng
// Index này đảm bảo mỗi user chỉ có một record tiến độ cho mỗi tập phim (movie + episodeSlug)
watchSessionSchema.index(
  { user: 1, movie: 1, episodeSlug: 1 },
  { unique: true }
);

// Index để lấy nhanh lịch sử xem gần nhất của một user
watchSessionSchema.index({ user: 1, lastWatchedAt: -1 });

const WatchSession = mongoose.model("WatchSession", watchSessionSchema);

export default WatchSession;
