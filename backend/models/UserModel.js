import mongoose from "mongoose";
import bcrypt from "bcryptjs"; // Sẽ cài đặt thư viện này sau

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Please provide a username"],
      unique: true,
      trim: true,
      minlength: [3, "Username must be at least 3 characters long"],
    },
    email: {
      type: String,
      required: [true, "Please provide an email"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email address",
      ],
    },
    password: {
      type: String,
      required: [true, "Please provide a password"],
      minlength: [6, "Password must be at least 6 characters long"],
      select: false, // Mật khẩu sẽ không được trả về trong query trừ khi được chỉ định rõ
    },
    avatarUrl: {
      type: String,
      default: "https://i.pravatar.cc/150?u=default", // Placeholder avatar
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    // Google OAuth specific fields
    googleId: {
      type: String,
      unique: true,
      sparse: true, // Cho phép nhiều document có giá trị null cho googleId, nhưng nếu có giá trị thì phải unique
    },
    // Trường displayName có thể lấy từ Google hoặc người dùng tự đặt
    displayName: {
      type: String,
      trim: true,
    },
    // Chúng ta có thể thêm các trường khác như facebookId nếu cần sau này

    // Fields for watch history, favorites, etc. can be added later or handled in separate collections
    // watchHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Movie' }],
    // favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Movie' }],
  },
  {
    timestamps: true, // Tự động thêm createdAt và updatedAt
  }
);

// Middleware để hash mật khẩu trước khi lưu
userSchema.pre("save", async function (next) {
  // Chỉ hash mật khẩu nếu nó đã được thay đổi (hoặc là mới) VÀ nó có giá trị
  if (!this.isModified("password") || !this.password) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method để so sánh mật khẩu đã nhập với mật khẩu đã hash trong DB
userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false; // Nếu user không có password (ví dụ đăng nhập bằng Google)
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
