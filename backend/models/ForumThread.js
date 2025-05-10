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
      // index: true // Có thể thêm index để tăng tốc độ truy vấn bằng slug
    },
    content: {
      type: String,
      required: [true, "Vui lòng nhập nội dung"],
      // minlength: [10, 'Nội dung phải có ít nhất 10 ký tự'] // Tuỳ chọn
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
  },
  { timestamps: true }
); // Tự động thêm createdAt và updatedAt

// Middleware để tạo slug từ title trước khi lưu
ForumThreadSchema.pre("save", function (next) {
  if (!this.isModified("title")) {
    next();
  }
  // Tạo slug duy nhất bằng cách thêm một phần timestamp hoặc chuỗi ngẫu nhiên ngắn
  this.slug = `${slugify(this.title, {
    lower: true,
    strict: true,
    locale: "vi",
  })}-${Date.now().toString(36)}${Math.random().toString(36).substring(2, 5)}`;
  next();
});

// TODO: Khi tạo reply mới, cần cập nhật replyCount, lastReplyTime, lastReplyAuthor của Thread này.
// TODO: Khi xem thread, cần tăng views.

export default mongoose.model("ForumThread", ForumThreadSchema);
