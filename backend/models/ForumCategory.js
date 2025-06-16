import mongoose from "mongoose";
import slugify from "slugify"; // Cần cài đặt: npm install slugify

const ForumCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Vui lòng nhập tên danh mục"],
    unique: true,
    trim: true,
    maxlength: [50, "Tên danh mục không được vượt quá 50 ký tự"],
  },
  slug: String,
  description: {
    type: String,
    maxlength: [500, "Mô tả không được vượt quá 500 ký tự"],
  },
  threadCount: {
    type: Number,
    default: 0,
  },
  // Thêm các trường cho admin quản lý
  isActive: {
    type: Boolean,
    default: true,
  },
  order: {
    type: Number,
    default: 0,
  },
  icon: {
    type: String,
    default: null,
  },
  color: {
    type: String,
    default: "#007bff",
  },
  // Quyền truy cập
  allowedRoles: [
    {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
  ],
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },
  lastModifiedBy: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Middleware để tạo slug từ name trước khi lưu
ForumCategorySchema.pre("save", function (next) {
  if (!this.isModified("name")) {
    next();
  }
  this.slug = slugify(this.name, { lower: true, strict: true, locale: "vi" });
  this.updatedAt = Date.now();
  next();
});

// Middleware để cập nhật slug nếu name thay đổi
ForumCategorySchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate();
  if (update.name) {
    const newSlug = slugify(update.name, {
      lower: true,
      strict: true,
      locale: "vi",
    });
    this.set({ slug: newSlug });
  }
  this.set({ updatedAt: Date.now() });
  next();
});

// Index để tăng hiệu suất
ForumCategorySchema.index({ order: 1, isActive: 1 });
ForumCategorySchema.index({ slug: 1 });

export default mongoose.model("ForumCategory", ForumCategorySchema);
