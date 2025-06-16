import crypto from "crypto";
import User from "../models/UserModel.js";
import generateToken from "../utils/generateToken.js";
import {
  sendVerificationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendPasswordResetSuccessEmail,
} from "../utils/emailService.js";

// @desc    Đăng ký tài khoản mới
// @route   POST /auth/register
// @access  Public
export const registerUser = async (req, res) => {
  try {
    const { username, email, password, displayName, avatarUrl } = req.body;

    // Kiểm tra user đã tồn tại
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({
        message: "Người dùng với email hoặc username này đã tồn tại",
      });
    }

    // Tạo user mới (chưa xác nhận email)
    const user = new User({
      username,
      email,
      password,
      displayName: displayName || username,
      avatarUrl,
      isEmailVerified: false, // Chưa xác nhận email
      isGoogleAccount: false, // Đăng ký thông thường
    });

    // Tạo token xác nhận email
    const verificationToken = user.createEmailVerificationToken();
    await user.save();

    // Gửi email xác nhận
    const emailResult = await sendVerificationEmail(
      email,
      verificationToken,
      username
    );

    if (!emailResult.success) {
      // Nếu gửi email thất bại, xóa user đã tạo
      await User.findByIdAndDelete(user._id);
      return res.status(500).json({
        message: "Không thể gửi email xác nhận. Vui lòng thử lại.",
      });
    }

    res.status(201).json({
      message:
        "Đăng ký thành công! Vui lòng kiểm tra email để xác nhận tài khoản.",
      email: user.email,
      username: user.username,
      needsVerification: true,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      message: "Lỗi server khi đăng ký tài khoản",
    });
  }
};

// @desc    Xác nhận email
// @route   GET /auth/verify-email/:token
// @access  Public
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        message: "Token xác nhận không được cung cấp",
      });
    }

    // Hash token để so sánh với database
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Tìm user với token và kiểm tra thời gian hết hạn
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      // Kiểm tra xem có user nào với token này không (có thể đã hết hạn)
      const userWithExpiredToken = await User.findOne({
        emailVerificationToken: hashedToken,
      });

      if (userWithExpiredToken) {
        return res.status(400).json({
          message:
            "Token xác nhận đã hết hạn. Vui lòng yêu cầu gửi lại email xác nhận.",
          expired: true,
          email: userWithExpiredToken.email,
        });
      }

      return res.status(400).json({
        message: "Token xác nhận không hợp lệ",
        invalid: true,
      });
    }

    // Kiểm tra xem user đã được verify chưa
    if (user.isEmailVerified) {
      return res.status(400).json({
        message: "Email đã được xác nhận trước đó. Bạn có thể đăng nhập ngay.",
        alreadyVerified: true,
      });
    }

    // Cập nhật trạng thái xác nhận
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    // Gửi email chào mừng (không blocking nếu thất bại)
    try {
      await sendWelcomeEmail(user.email, user.username);
    } catch (emailError) {
      console.error("Warning: Could not send welcome email:", emailError);
    }

    res.status(200).json({
      message: "Xác nhận email thành công! Bạn có thể đăng nhập ngay bây giờ.",
      verified: true,
    });
  } catch (error) {
    console.error("Email verification error:", error);
    res.status(500).json({
      message: "Lỗi server khi xác nhận email",
    });
  }
};

// @desc    Đăng nhập
// @route   POST /auth/login
// @access  Public
export const loginUser = async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;

    if (!emailOrUsername || !password) {
      return res.status(400).json({
        message: "Vui lòng nhập email/username và mật khẩu",
      });
    }

    // Tìm user và include password để verify
    const user = await User.findOne({
      $or: [{ email: emailOrUsername }, { username: emailOrUsername }],
    }).select("+password");

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({
        message: "Email/username hoặc mật khẩu không đúng",
      });
    }

    // Kiểm tra trạng thái tài khoản với auto-unsuspend
    if (user.status === "suspended") {
      // Kiểm tra xem suspension có hết hạn chưa
      if (user.suspensionExpires && new Date() > user.suspensionExpires) {
        // Tự động mở khóa
        user.status = "active";
        user.suspendedBy = undefined;
        user.suspendedAt = undefined;
        user.suspensionReason = undefined;
        user.suspensionExpires = undefined;
        await user.save();
        console.log(`Auto-unsuspended user: ${user.email}`);
      } else {
        const daysLeft = user.suspensionExpires
          ? Math.ceil(
              (user.suspensionExpires - new Date()) / (1000 * 60 * 60 * 24)
            )
          : "không xác định";

        return res.status(403).json({
          message: "Tài khoản của bạn đang bị tạm khóa.",
          accountStatus: "suspended",
          suspensionReason: user.suspensionReason,
          suspensionExpires: user.suspensionExpires,
          daysLeft: daysLeft,
          suspendedAt: user.suspendedAt,
        });
      }
    }

    if (user.status === "banned") {
      return res.status(403).json({
        message: "Tài khoản của bạn đã bị cấm vĩnh viễn.",
        accountStatus: "banned",
        banReason: user.banReason,
        bannedAt: user.bannedAt,
      });
    }

    if (user.status === "inactive") {
      return res.status(403).json({
        message: "Tài khoản của bạn đã bị vô hiệu hóa.",
        accountStatus: "inactive",
      });
    }

    // Kiểm tra email verification (chỉ với tài khoản thông thường, không áp dụng cho admin)
    if (
      !user.isGoogleAccount &&
      !user.isEmailVerified &&
      user.role !== "admin"
    ) {
      return res.status(401).json({
        message:
          "Tài khoản chưa được xác nhận. Vui lòng kiểm tra email để xác nhận tài khoản.",
        needsVerification: true,
        email: user.email,
      });
    }

    // Đăng nhập thành công
    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      role: user.role,
      status: user.status,
      isEmailVerified: user.isEmailVerified,
      isGoogleAccount: user.isGoogleAccount,
      token: generateToken(user._id),
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      message: "Lỗi server khi đăng nhập",
    });
  }
};

// @desc    Gửi lại email xác nhận
// @route   POST /auth/resend-verification
// @access  Public
export const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Vui lòng nhập email",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "Không tìm thấy tài khoản với email này",
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        message: "Email đã được xác nhận rồi",
      });
    }

    if (user.isGoogleAccount) {
      return res.status(400).json({
        message: "Tài khoản Google không cần xác nhận email",
      });
    }

    // Tạo token mới
    const verificationToken = user.createEmailVerificationToken();
    await user.save();

    // Gửi email
    const emailResult = await sendVerificationEmail(
      email,
      verificationToken,
      user.username
    );

    if (!emailResult.success) {
      return res.status(500).json({
        message: "Không thể gửi email xác nhận. Vui lòng thử lại.",
      });
    }

    res.status(200).json({
      message: "Email xác nhận đã được gửi lại. Vui lòng kiểm tra hộp thư.",
    });
  } catch (error) {
    console.error("Resend verification error:", error);
    res.status(500).json({
      message: "Lỗi server khi gửi lại email xác nhận",
    });
  }
};

// @desc    Lấy thông tin user hiện tại
// @route   GET /auth/me
// @access  Private
export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: "Không tìm thấy thông tin người dùng",
      });
    }

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      isGoogleAccount: user.isGoogleAccount,
      googleId: user.googleId,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({
      message: "Lỗi server khi lấy thông tin người dùng",
    });
  }
};

// @desc    Gửi email reset password
// @route   POST /auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Vui lòng nhập email",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "Không tìm thấy tài khoản với email này",
      });
    }

    // Tài khoản Google không thể reset password
    if (user.isGoogleAccount) {
      return res.status(400).json({
        message:
          "Tài khoản Google không thể đặt lại mật khẩu. Vui lòng đăng nhập bằng Google.",
      });
    }

    // Tạo reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // Gửi email reset password
    const emailResult = await sendPasswordResetEmail(
      email,
      resetToken,
      user.username
    );

    if (!emailResult.success) {
      // Xóa token nếu gửi email thất bại
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        message: "Không thể gửi email đặt lại mật khẩu. Vui lòng thử lại.",
      });
    }

    res.status(200).json({
      message: "Link đặt lại mật khẩu đã được gửi đến email của bạn.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      message: "Lỗi server khi xử lý yêu cầu đặt lại mật khẩu",
    });
  }
};

// @desc    Reset password với token
// @route   POST /auth/reset-password/:token
// @access  Public
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    if (!password || !confirmPassword) {
      return res.status(400).json({
        message: "Vui lòng nhập mật khẩu và xác nhận mật khẩu",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        message: "Mật khẩu xác nhận không khớp",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Mật khẩu phải có ít nhất 6 ký tự",
      });
    }

    // Hash token để so sánh với database
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Tìm user với token và kiểm tra thời gian hết hạn
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        message: "Token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn",
      });
    }

    // Cập nhật mật khẩu mới
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // Gửi email thông báo thay đổi mật khẩu thành công
    await sendPasswordResetSuccessEmail(user.email, user.username);

    res.status(200).json({
      message:
        "Mật khẩu đã được đặt lại thành công. Bạn có thể đăng nhập với mật khẩu mới.",
      success: true,
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      message: "Lỗi server khi đặt lại mật khẩu",
    });
  }
};
