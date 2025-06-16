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
import notificationRoutes from "./routes/notificationRoutes.js";
import likeRoutes from "./routes/likeRoutes.js";

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
app.use("/api/admin/notifications", adminNotificationRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/likes", likeRoutes);

// Global Error Handler - xử lý lỗi toàn cục
app.use((err, req, res, next) => {
  console.error("Global Error Handler:", err.message);
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || "Something went wrong!",
  });
});

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
