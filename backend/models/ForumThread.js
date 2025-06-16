import mongoose from "mongoose";
import slugify from "slugify";

const ForumThreadSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Vui lòng nhập tiêu đề"],
      trim: true,
      maxlength: [150, "Tiêu đề không được vượt quá 150 ký tự"],
    },
    slug: {
      type: String,
      unique: true,
      index: true, // Index để tăng tốc độ truy vấn bằng slug
    },
    content: {
      type: String,
      required: [true, "Vui lòng nhập nội dung"],
      minlength: [10, "Nội dung phải có ít nhất 10 ký tự"],
    },
    author: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    category: {
      type: mongoose.Schema.ObjectId,
      ref: "ForumCategory",
      required: true,
    },
    replyCount: {
      type: Number,
      default: 0,
    },
    lastReplyTime: {
      type: Date,
    },
    lastReplyAuthor: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
    views: {
      type: Number,
      default: 0,
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    // Thêm các trường cho admin quản lý
    isApproved: {
      type: Boolean,
      default: true, // Có thể đặt false nếu cần duyệt bài
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
    deletedBy: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
    deleteReason: {
      type: String,
      maxlength: [200, "Lý do xóa không được vượt quá 200 ký tự"],
    },
    // Trạng thái kiểm duyệt
    moderationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    moderatedBy: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
    moderationNote: {
      type: String,
      maxlength: [300, "Ghi chú kiểm duyệt không được vượt quá 300 ký tự"],
    },
    moderatedAt: {
      type: Date,
    },
    // Tags cho thread (existing - cho hashtags/keywords thông thường)
    tags: [
      {
        type: String,
        trim: true,
        maxlength: [30, "Tag không được vượt quá 30 ký tự"],
      },
    ],
    // 🎬 MOVIE METADATA - Support multiple movies
    movieMetadata: [
      {
        // Reference đến movie (sử dụng String ID từ API phim)
        movieId: {
          type: String,
          ref: "MovieMetadata",
          required: true,
          index: true, // Index để search threads theo phim
        },
        // Lưu slug để tạo link nhanh, tránh query thêm
        movieSlug: {
          type: String,
          trim: true,
          required: true,
        },
        // Lưu tên phim để hiển thị nhanh, tránh populate
        movieTitle: {
          type: String,
          trim: true,
          maxlength: [200, "Tên phim không được vượt quá 200 ký tự"],
          required: true,
        },
        // Lưu poster URL để hiển thị preview
        moviePosterUrl: {
          type: String,
          trim: true,
          default: null,
        },
        // Type phim để filter (single/series/hoathinh/tvshows)
        movieType: {
          type: String,
          enum: ["single", "series", "hoathinh", "tvshows"],
          default: null,
        },
        // Năm phim để sort/filter
        movieYear: {
          type: Number,
          min: 1900,
          max: 2030,
          default: null,
        },
        // Đánh dấu đây có phải phim chính không (primary movie)
        isPrimary: {
          type: Boolean,
          default: false,
        },
        // ⭐ Rating information from MovieMetadata
        appAverageRating: {
          type: Number,
          min: 0,
          max: 10,
          default: 0,
        },
        appRatingCount: {
          type: Number,
          min: 0,
          default: 0,
        },
        appTotalViews: {
          type: Number,
          min: 0,
          default: 0,
        },
        appTotalFavorites: {
          type: Number,
          min: 0,
          default: 0,
        },
      },
    ],
    // Đánh dấu thread này có liên quan chặt chẽ đến phim không
    isMovieDiscussion: {
      type: Boolean,
      default: false,
      index: true, // Index để filter movie discussion threads
    },
    // Độ ưu tiên (cho việc sắp xếp)
    priority: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    // Thống kê
    likeCount: {
      type: Number,
      default: 0,
    },
    reportCount: {
      type: Number,
      default: 0,
    },
    // Thêm trường để track auto-approval
    autoApproved: {
      type: Boolean,
      default: false,
    },
    // Lý do auto-approve (nếu có)
    autoApprovalReason: {
      type: String,
      enum: ["trusted_user", "admin", "moderator"],
    },
    // Đánh dấu cần chỉnh sửa do moderation
    requiresEditing: {
      type: Boolean,
      default: false,
    },
    editingNote: {
      type: String,
      maxlength: [300, "Ghi chú chỉnh sửa không được vượt quá 300 ký tự"],
    },
  },
  { timestamps: true }
); // Tự động thêm createdAt và updatedAt

// Middleware để tạo slug từ title trước khi lưu
ForumThreadSchema.pre("save", function (next) {
  if (!this.isModified("title")) {
    return next();
  }
  // Tạo slug duy nhất bằng cách thêm một phần timestamp hoặc chuỗi ngẫu nhiên ngắn
  this.slug = `${slugify(this.title, {
    lower: true,
    strict: true,
    locale: "vi",
  })}-${Date.now().toString(36)}${Math.random().toString(36).substring(2, 5)}`;
  next();
});

// ===== 🚀 ENHANCED DATABASE INDEXES =====
// Basic indexes (existing)
ForumThreadSchema.index({ category: 1, isPinned: -1, createdAt: -1 });
ForumThreadSchema.index({ author: 1, createdAt: -1 });
ForumThreadSchema.index({ isDeleted: 1, moderationStatus: 1 });
ForumThreadSchema.index({ tags: 1 });

// 🚀 NEW COMPOUND INDEXES for better performance
ForumThreadSchema.index({
  moderationStatus: 1,
  isDeleted: 1,
  category: 1,
  lastReplyTime: -1,
}); // For getForumThreadsWithPagination

ForumThreadSchema.index({
  slug: 1,
  moderationStatus: 1,
  isDeleted: 1,
}); // For getThreadBySlug

ForumThreadSchema.index({
  author: 1,
  createdAt: -1,
  moderationStatus: 1,
}); // For user's threads

ForumThreadSchema.index({
  views: -1,
  moderationStatus: 1,
  isDeleted: 1,
}); // For popular threads

ForumThreadSchema.index({
  likeCount: -1,
  moderationStatus: 1,
  isDeleted: 1,
  createdAt: -1,
}); // For top liked threads

// 🎬 MOVIE METADATA INDEXES for thread-movie relationships (updated for array)
ForumThreadSchema.index({
  "movieMetadata.movieId": 1,
  moderationStatus: 1,
  isDeleted: 1,
}); // For threads by movie

ForumThreadSchema.index({
  isMovieDiscussion: 1,
  "movieMetadata.movieType": 1,
  createdAt: -1,
}); // For movie discussion filtering

ForumThreadSchema.index({
  "movieMetadata.movieYear": 1,
  "movieMetadata.movieType": 1,
}); // For movie year/type filtering

ForumThreadSchema.index({
  "movieMetadata.isPrimary": 1,
  moderationStatus: 1,
  isDeleted: 1,
}); // For primary movie threads

// 🔍 TEXT INDEX for search functionality (updated to include movie title)
ForumThreadSchema.index(
  {
    title: "text",
    content: "text",
    tags: "text",
    "movieMetadata.movieTitle": "text", // ✅ Include movie title in search
  },
  {
    weights: {
      title: 10, // Title has highest weight
      "movieMetadata.movieTitle": 8, // Movie title has high weight
      tags: 5, // Tags have medium weight
      content: 1, // Content has lowest weight
    },
    name: "forum_thread_text_search",
  }
);

// Method kiểm tra quyền
ForumThreadSchema.methods.canBeModeratedBy = function (user) {
  return (
    user.role === "admin" || this.author.toString() === user._id.toString()
  );
};

// Method soft delete
ForumThreadSchema.methods.softDelete = function (deletedBy, reason) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = deletedBy;
  if (reason) this.deleteReason = reason;
  return this.save();
};

export default mongoose.model("ForumThread", ForumThreadSchema);
