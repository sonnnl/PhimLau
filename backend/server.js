import express from "express";
import { createServer } from "http";
import dotenv from "dotenv";
import cors from "cors";
import passport from "passport";
import connectDB from "./config/db.js";
import setupSocket from "./config/socket.js";
import "./config/passportSetup.js";
import authRoutes from "./routes/authRoutes.js";
import movieRoutes from "./routes/movieRoutes.js";
import forumRoutes from "./routes/forumRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import adminRoutes from "./admin/routes/adminRoutes.js";
import adminNotificationRoutes from "./admin/routes/adminNotificationRoutes.js";
import reviewAdminRoutes from "./admin/routes/reviewAdminRoutes.js";
import adminLogRoutes from "./admin/routes/adminLogRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import likeRoutes from "./routes/likeRoutes.js";
import favoriteRoutes from "./routes/favoriteRoutes.js";
import watchSessionRoutes from "./routes/watchSession.routes.js";

import { protect } from "./middleware/authMiddleware.js";

// Tải các biến môi trường từ file .env
dotenv.config();

// Kết nối đến cơ sở dữ liệu MongoDB
connectDB();

const app = express();
const PORT = process.env.PORT || 5001; // Đặt PORT mặc định nếu không có trong .env

// Cấu hình middleware cho CORS - cho phép cross-origin requests
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);

// Middleware để parse JSON và URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Khởi tạo Passport middleware cho authentication
app.use(passport.initialize());

// Cấu hình các routes chính của ứng dụng
app.use("/auth", authRoutes);
app.use("/api/movies", movieRoutes);
app.use("/api/forum", forumRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin/reviews", reviewAdminRoutes);
app.use("/api/admin/notifications", adminNotificationRoutes);
app.use("/api/admin/logs", adminLogRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/likes", likeRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/continue-watching", watchSessionRoutes);

// Định nghĩa middleware xử lý lỗi ngay tại đây
// Middleware xử lý lỗi 404 Not Found
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Middleware xử lý lỗi chung
const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};

// Custom Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

// Tạo HTTP server và thiết lập Socket.IO cho real-time communication
const server = createServer(app);
const io = setupSocket(server);

// Lưu trữ socket.io instance trong app để sử dụng trong các controller
app.set("io", io);

// Khởi động server và lắng nghe trên port được chỉ định
server.listen(PORT, () => {
  console.log(`🚀 Backend server is running on http://localhost:${PORT}`);
});

app.get("/", (req, res) => {
  res.send("API is running...");
});
