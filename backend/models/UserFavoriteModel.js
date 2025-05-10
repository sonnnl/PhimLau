import mongoose from "mongoose";

const userFavoriteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Tham chiếu đến UserModel
      required: [true, "User is required to favorite a movie"],
    },
    movie: {
      type: String, // Sẽ lưu _id (movieId từ API phim) của MovieMetadataModel
      ref: "MovieMetadata", // Tham chiếu đến MovieMetadataModel
      required: [true, "Movie is required to be favorited"],
    },
    // Bạn có thể thêm các thông tin phụ nếu cần, ví dụ:
    // notes: String, // Ghi chú cá nhân của người dùng về phim yêu thích này
  },
  {
    timestamps: true, // Tự động thêm createdAt (khi phim được yêu thích) và updatedAt
  }
);

// Tạo một index tổng hợp unique để đảm bảo một người dùng không thể yêu thích cùng một bộ phim nhiều lần.
userFavoriteSchema.index({ user: 1, movie: 1 }, { unique: true });

// Tạo index riêng cho user và movie để tăng tốc độ truy vấn khi tìm phim yêu thích của user hoặc user đã yêu thích phim.
userFavoriteSchema.index({ user: 1 });
userFavoriteSchema.index({ movie: 1 });

// Middleware hoặc static method để cập nhật `appTotalFavorites` trong MovieMetadataModel
// khi một phim được thêm/bỏ yêu thích.
// Ví dụ:
// userFavoriteSchema.statics.updateFavoriteCount = async function(movieId, increment) {
//   try {
//     await mongoose.model('MovieMetadata').findByIdAndUpdate(movieId, {
//       $inc: { appTotalFavorites: increment ? 1 : -1 }
//     });
//   } catch (err) {
//     console.error('Error updating favorite count:', err);
//   }
// };

// // Sau khi một UserFavorite được tạo (lưu vào DB)
// userFavoriteSchema.post('save', async function() {
//   await this.constructor.updateFavoriteCount(this.movie, true);
// });

// // Trước khi một UserFavorite bị xóa
// userFavoriteSchema.post('remove', async function(doc) { // 'remove' middleware hoạt động trên document đã được remove
//   await doc.constructor.updateFavoriteCount(doc.movie, false);
// });
// // Lưu ý: 'remove' document middleware có một số khác biệt so với query middleware.
// // Nếu bạn dùng findByIdAndRemove, bạn có thể cần dùng pre hook và lưu doc vào this để post hook truy cập được,
// // hoặc thực hiện logic cập nhật trong controller.

const UserFavorite = mongoose.model("UserFavorite", userFavoriteSchema);

export default UserFavorite;
