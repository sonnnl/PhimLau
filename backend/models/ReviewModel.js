import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Tham chiếu đến UserModel
      required: [true, "User is required for a review"],
    },
    movie: {
      type: String, // Sẽ lưu _id (movieId từ API phim) của MovieMetadataModel
      ref: "MovieMetadata", // Tham chiếu đến MovieMetadataModel
      required: [true, "Movie is required for a review"],
    },
    rating: {
      type: Number,
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating must be at most 5"], // Đổi thành thang 5 sao
      // required: [true, 'Rating is required'], // Có thể không bắt buộc nếu chỉ cho phép bình luận
    },
    content: {
      type: String,
      trim: true,
      maxlength: [5000, "Review content cannot exceed 5000 characters"],
      required: [true, "Review content cannot be empty"],
    },
    // Cho phép trả lời bình luận (bình luận cha)
    parentReview: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Review", // Tham chiếu đến chính nó
      default: null,
    },
    // Optional: theo dõi lượt upvote/downvote cho bình luận
    // upvotes: {
    //   type: Number,
    //   default: 0
    // },
    // downvotes: {
    //   type: Number,
    //   default: 0
    // },
    // usersUpvoted: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    // usersDownvoted: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  {
    timestamps: true, // Tự động thêm createdAt và updatedAt
  }
);

// Tạo index để tăng tốc độ truy vấn review theo phim và người dùng
reviewSchema.index({ movie: 1, createdAt: -1 }); // Lấy review mới nhất của phim
reviewSchema.index({ user: 1, movie: 1 }, { unique: true }); // Mỗi user chỉ được review 1 phim 1 lần (nếu muốn)
// Nếu bạn không muốn giới hạn mỗi user chỉ review 1 lần, hãy xóa index unique ở trên
// Hoặc, nếu bạn cho phép sửa review, thì logic này sẽ nằm ở controller.

// Middleware hoặc static method để tính toán lại rating trung bình cho MovieMetadata
reviewSchema.statics.calculateAverageRating = async function (movieId) {
  const stats = await this.aggregate([
    { $match: { movie: movieId, rating: { $exists: true, $ne: null } } }, // Đảm bảo rating tồn tại và không null
    {
      $group: {
        _id: "$movie",
        averageRating: { $avg: "$rating" },
        ratingCount: { $sum: 1 },
      },
    },
  ]);

  try {
    const MovieMetadata = mongoose.model("MovieMetadata"); // Lấy model ở đây
    if (stats.length > 0) {
      await MovieMetadata.findByIdAndUpdate(movieId, {
        appAverageRating: parseFloat(stats[0].averageRating.toFixed(1)), // Làm tròn đến 1 chữ số thập phân
        appRatingCount: stats[0].ratingCount,
      });
    } else {
      await MovieMetadata.findByIdAndUpdate(movieId, {
        appAverageRating: 0,
        appRatingCount: 0,
      });
    }
  } catch (err) {
    console.error("Error calculating average rating:", err);
  }
};

// Gọi calculateAverageRating sau khi save hoặc remove
reviewSchema.post("save", async function () {
  await this.constructor.calculateAverageRating(this.movie);
});

// Middleware cho remove. findOneAndRemove sẽ trigger hook này.
reviewSchema.post("findOneAndRemove", async function (doc) {
  if (doc) {
    await doc.constructor.calculateAverageRating(doc.movie);
  }
});

// Nếu bạn dùng deleteOne hoặc deleteMany, bạn cần xử lý riêng vì chúng không trigger document middleware
// Tuy nhiên, với việc xóa review, thường sẽ xóa theo ID cụ thể, nên findOneAndRemove là phổ biến.

const Review = mongoose.model("Review", reviewSchema);

export default Review;
