import express from "express";
import passport from "passport";
import generateToken from "../utils/generateToken.js";
import User from "../models/UserModel.js";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

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
  passport.authenticate("google", {
    failureRedirect: `${
      process.env.FRONTEND_URL || "http://localhost:3000"
    }/login?error=google_auth_failed`,
    session: false, // Không sử dụng session của Passport, chúng ta sẽ dùng JWT
  }),
  (req, res) => {
    // Xác thực thành công, req.user chứa thông tin user từ hàm done() của strategy
    if (!req.user) {
      return res.redirect(
        `${
          process.env.FRONTEND_URL || "http://localhost:3000"
        }/login?error=authentication_failed`
      );
    }

    const token = generateToken(req.user._id);

    // Điều hướng người dùng trở lại frontend với token
    // Bạn có thể gửi token qua query parameter, cookie, hoặc trong body của một POST request (phức tạp hơn)
    // Gửi qua query parameter là cách đơn giản để bắt đầu.
    // Frontend sẽ cần lấy token này từ URL và lưu vào localStorage/sessionStorage.
    res.redirect(
      `${
        process.env.FRONTEND_URL || "http://localhost:3000"
      }/auth/callback?token=${token}`
    );

    // Hoặc, nếu muốn gửi token dưới dạng JSON (frontend sẽ cần xử lý khác)
    // res.status(200).json({
    //   message: 'Google authentication successful',
    //   token: token,
    //   user: {
    //     _id: req.user._id,
    //     displayName: req.user.displayName,
    //     email: req.user.email,
    //     avatarUrl: req.user.avatarUrl,
    //     role: req.user.role
    //   }
    // });
  }
);

// @desc    Register a new user
// @route   POST /auth/register
// @access  Public
router.post("/register", async (req, res, next) => {
  const { username, email, password, displayName, avatarUrl } = req.body;

  try {
    const userExists = await User.findOne({ $or: [{ email }, { username }] });

    if (userExists) {
      return res
        .status(400)
        .json({ message: "User with this email or username already exists" });
    }

    const user = await User.create({
      username,
      email,
      password, // Mật khẩu sẽ được hash tự động bởi middleware trong UserModel
      displayName: displayName || username, // Nếu không có displayName thì dùng username
      avatarUrl, // Có thể để trống để dùng default từ schema
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        role: user.role,
        token: generateToken(user._id),
        createdAt: user.createdAt,
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    next(error); // Chuyển lỗi cho global error handler
  }
});

// @desc    Auth user & get token (Login)
// @route   POST /auth/login
// @access  Public
router.post("/login", async (req, res, next) => {
  const { emailOrUsername, password } = req.body;

  if (!emailOrUsername || !password) {
    return res
      .status(400)
      .json({ message: "Please provide email/username and password" });
  }

  try {
    // Tìm user bằng email hoặc username
    const user = await User.findOne({
      $or: [{ email: emailOrUsername }, { username: emailOrUsername }],
    }).select("+password"); // Quan trọng: Phải select password để so sánh

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        role: user.role,
        token: generateToken(user._id),
        createdAt: user.createdAt,
      });
    } else {
      res.status(401).json({ message: "Invalid email/username or password" });
    }
  } catch (error) {
    next(error);
  }
});

// Middleware để bảo vệ route (ví dụ)
const protect = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password"); // Lấy user, bỏ password
      if (!req.user) {
        return res
          .status(401)
          .json({ message: "Not authorized, user not found" });
      }
      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  }
  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }
};

// @desc    Get current logged-in user
// @route   GET /auth/me
// @access  Private (cần middleware xác thực token)
router.get("/me", protect, (req, res) => {
  // req.user đã được gán từ middleware `protect`
  if (req.user) {
    res.status(200).json({
      _id: req.user._id,
      username: req.user.username,
      email: req.user.email,
      displayName: req.user.displayName,
      avatarUrl: req.user.avatarUrl,
      role: req.user.role,
      googleId: req.user.googleId,
      createdAt: req.user.createdAt,
    });
  } else {
    // Dòng này không nên xảy ra nếu `protect` hoạt động đúng
    res
      .status(404)
      .json({ message: "User not found after token verification" });
  }
});

export default router;
