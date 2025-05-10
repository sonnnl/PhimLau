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
      // required: [true, 'Episode identifier is required'], // Bỏ comment nếu bạn luôn yêu cầu, kể cả phim lẻ
    },
    serverName: {
      // Tên server phim đã xem, ví dụ: 'Server Vietsub #1', 'Server Thuyết Minh'
      // Thông tin này lấy từ API phim khi người dùng chọn server để xem
      type: String,
      trim: true,
    },
    progressSeconds: {
      // Thời lượng đã xem của tập phim này (tính bằng giây)
      type: Number,
      default: 0,
      min: 0,
    },
    totalDurationSeconds: {
      // Tổng thời lượng của tập phim này (tính bằng giây)
      // Nên lấy từ API phim để tính toán % chính xác
      type: Number,
      min: 0,
    },
    completed: {
      // Đánh dấu tập phim này đã được xem hết chưa
      type: Boolean,
      default: false,
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

// Optional: Middleware hoặc static method để cập nhật `appTotalViews` trong MovieMetadataModel
// Việc này có thể phức tạp hơn vì định nghĩa "view" (xem một phần hay xem hết?)
// Ví dụ đơn giản:
// watchSessionSchema.statics.updateMovieViews = async function(movieId) {
//   try {
//     // Logic để xác định một "view" hợp lệ có thể dựa trên completed: true hoặc progressSeconds > threshold
//     // Ví dụ: Đếm số watch sessions đã hoàn thành cho một phim
//     const completedViews = await this.countDocuments({ movie: movieId, completed: true });

//     await mongoose.model('MovieMetadata').findByIdAndUpdate(movieId, {
//       appTotalViews: completedViews
//       // Hoặc $inc nếu bạn muốn tăng dần mỗi khi có một session mới/hoàn thành
//     });
//   } catch (err) {
//     console.error('Error updating movie views:', err);
//   }
// };

// // Gọi sau khi một session được cập nhật (ví dụ khi `completed` thành true)
// watchSessionSchema.post('save', async function() {
//   if (this.isModified('completed') && this.completed) {
//     await this.constructor.updateMovieViews(this.movie);
//   }
// });

const WatchSession = mongoose.model("WatchSession", watchSessionSchema);

export default WatchSession;
