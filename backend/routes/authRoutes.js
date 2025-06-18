import express from "express";
import passport from "passport";
import generateToken from "../utils/generateToken.js";
import User from "../models/UserModel.js";
import dotenv from "dotenv";
import { protect } from "../middleware/authMiddleware.js";
import {
  registerUser,
  loginUser,
  verifyEmail,
  resendVerificationEmail,
  getCurrentUser,
  forgotPassword,
  resetPassword,
} from "../controllers/authController.js";

dotenv.config();

const router = express.Router();

// @desc    Auth with Google
// @route   GET /auth/google
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"], // Yêu cầu quyền truy cập profile và email từ Google
  })
);

// @desc    Google auth callback
// @route   GET /auth/google/callback
router.get(
  "/google/callback",
  (req, res, next) => {
    passport.authenticate("google", { session: false }, (err, user, info) => {
      if (err) {
        console.error("Google auth error:", err);
        return res.redirect(
          `${
            process.env.FRONTEND_URL || "http://localhost:3000"
          }/login?error=server_error`
        );
      }

      if (!user) {
        const accountStatus = info?.accountStatus;
        let redirectUrl = new URL(
          `${process.env.FRONTEND_URL || "http://localhost:3000"}/login`
        );

        let errorParam = "google_auth_failed";
        if (accountStatus === "suspended") errorParam = "account_suspended";
        else if (accountStatus === "banned") errorParam = "account_banned";
        else if (accountStatus === "inactive") errorParam = "account_inactive";

        redirectUrl.searchParams.set("error", errorParam);
        redirectUrl.searchParams.set(
          "message",
          info?.message || "Đăng nhập Google thất bại"
        );

        // Thêm chi tiết lỗi nếu có
        if (info?.reason) {
          redirectUrl.searchParams.set("reason", info.reason);
        }
        if (info?.expires) {
          redirectUrl.searchParams.set("expires", info.expires);
        }

        return res.redirect(redirectUrl.toString());
      }

      req.user = user;
      next();
    })(req, res, next);
  },
  async (req, res) => {
    try {
      // Xác thực thành công, req.user chứa thông tin user từ hàm done() của strategy
      if (!req.user) {
        return res.redirect(
          `${
            process.env.FRONTEND_URL || "http://localhost:3000"
          }/login?error=authentication_failed`
        );
      }

      // Cập nhật user để đánh dấu là Google account và đã verify email
      const user = await User.findByIdAndUpdate(
        req.user._id,
        {
          isGoogleAccount: true,
          isEmailVerified: true, // Google account tự động verify email
        },
        { new: true }
      );

      const token = generateToken(user._id);

      // Điều hướng người dùng trở lại frontend với token
      res.redirect(
        `${
          process.env.FRONTEND_URL || "http://localhost:3000"
        }/auth/callback?token=${token}`
      );
    } catch (error) {
      console.error("Google auth callback error:", error);
      res.redirect(
        `${
          process.env.FRONTEND_URL || "http://localhost:3000"
        }/login?error=server_error`
      );
    }
  }
);

// Auth routes sử dụng controller
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/verify-email/:token", verifyEmail);
router.post("/resend-verification", resendVerificationEmail);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.get("/me", protect, getCurrentUser);

export default router;
