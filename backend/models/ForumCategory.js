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
  createdAt: {
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
  next();
});

export default mongoose.model("ForumCategory", ForumCategorySchema);
