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

// Optional Auth: Middleware để optional check user (không bắt buộc login)
// Nếu có token hợp lệ thì set req.user, nếu không thì tiếp tục với req.user = null
const optionalAuth = asyncHandler(async (req, res, next) => {
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

      // Kiểm tra trạng thái tài khoản - nếu không hợp lệ thì set user = null
      if (
        req.user &&
        (req.user.status === "suspended" ||
          req.user.status === "banned" ||
          req.user.status === "inactive")
      ) {
        req.user = null;
      }
    } catch (error) {
      // Token không hợp lệ - không báo lỗi, chỉ set user = null
      req.user = null;
    }
  }

  // Không có token hoặc token không hợp lệ - tiếp tục với user = null
  next();
});

export { protect, admin, optionalAuth };
