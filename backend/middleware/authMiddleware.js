import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import User from "../models/UserModel.js";

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token
      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        res.status(401);
        throw new Error("Not authorized, user not found");
      }

      // Kiểm tra trạng thái tài khoản
      if (req.user.status === "suspended") {
        res.status(403);
        throw new Error("Tài khoản đã bị tạm khóa");
      }

      if (req.user.status === "banned") {
        res.status(403);
        throw new Error("Tài khoản đã bị cấm vĩnh viễn");
      }

      if (req.user.status === "inactive") {
        res.status(403);
        throw new Error("Tài khoản đã bị vô hiệu hóa");
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(401);
      throw new Error("Not authorized, token failed");
    }
  }

  if (!token) {
    res.status(401);
    throw new Error("Not authorized, no token");
  }
});

// Optional: Middleware to check for admin role
const admin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(401);
    throw new Error("Not authorized as an admin");
  }
};

// Middleware xác thực người dùng tùy chọn
const protectOptional = asyncHandler(async (req, res, next) => {
  let token;

  // Kiểm tra header Authorization
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Lấy token từ header
      token = req.headers.authorization.split(" ")[1];

      // Xác thực token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Lấy thông tin người dùng từ token (không lấy mật khẩu)
      req.user = await User.findById(decoded.id).select("-password");

      next();
    } catch (error) {
      // Nếu token không hợp lệ, không báo lỗi mà chỉ không gắn req.user
      // Điều này cho phép người dùng chưa đăng nhập vẫn truy cập được
      console.log("Optional auth: Invalid token, proceeding as guest.");
      next();
    }
  } else {
    // Không có token, tiếp tục như một khách
    next();
  }
});

export { protect, admin, protectOptional };
