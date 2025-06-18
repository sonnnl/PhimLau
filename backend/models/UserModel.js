import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto"; // Sẽ cài đặt thư viện này sau

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: function () {
        // Username chỉ bắt buộc nếu không phải Google account
        return !this.isGoogleAccount;
      },
      unique: true,
      sparse: true, // Cho phép nhiều null values nhưng unique khi có giá trị
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
      required: function () {
        // Password chỉ bắt buộc nếu không phải Google account
        return !this.isGoogleAccount;
      },
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
    status: {
      type: String,
      enum: ["active", "suspended", "banned", "inactive"],
      default: "active",
    },
    suspensionExpires: {
      type: Date,
    },
    suspensionReason: {
      type: String,
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    verificationToken: String,
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
    // Email verification fields
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      select: false, // Không trả về trong query thông thường
    },
    emailVerificationExpires: {
      type: Date,
      select: false,
    },
    // Password reset fields
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    // Đánh dấu tài khoản có phải từ Google không (để skip verification)
    isGoogleAccount: {
      type: Boolean,
      default: false,
    },
    // Đánh dấu user đã tùy chỉnh profile chưa (để tránh ghi đè khi đăng nhập Google)
    hasCustomizedProfile: {
      type: Boolean,
      default: false,
    },
    // Chúng ta có thể thêm các trường khác như facebookId nếu cần sau này

    // Fields for watch history, favorites, etc. can be added later or handled in separate collections
    // watchHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Movie' }],
    // favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Movie' }],

    // Forum activity tracking
    forumStats: {
      postsCount: {
        type: Number,
        default: 0,
      },
      repliesCount: {
        type: Number,
        default: 0,
      },
      likesReceived: {
        type: Number,
        default: 0,
      },
      reportsReceived: {
        type: Number,
        default: 0,
      },
      lastPostDate: {
        type: Date,
      },
    },

    // Moderation trust level
    trustLevel: {
      type: String,
      enum: ["new", "basic", "trusted", "moderator", "admin"],
      default: "new",
    },

    // Auto-approval eligibility
    autoApprovalEnabled: {
      type: Boolean,
      default: false,
    },

    // Moderation fields
    suspendedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    suspendedAt: {
      type: Date,
    },
    bannedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    bannedAt: {
      type: Date,
    },
    banReason: {
      type: String,
    },
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

// Method để tạo email verification token
userSchema.methods.createEmailVerificationToken = function () {
  const verificationToken = crypto.randomBytes(32).toString("hex");

  this.emailVerificationToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex");

  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 giờ

  return verificationToken;
};

// Method để tạo password reset token
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 phút

  return resetToken;
};

const User = mongoose.model("User", userSchema);

export default User;
