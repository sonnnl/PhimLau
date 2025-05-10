import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import passport from "passport";
import connectDB from "./config/db.js";
import "./config/passportSetup.js";
import authRoutes from "./routes/authRoutes.js";
import movieRoutes from "./routes/movieRoutes.js";
import forumRoutes from "./routes/forumRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();
const PORT = process.env.PORT || 5001; // Đặt PORT mặc định nếu không có trong .env

// Middlewares
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Passport middleware
app.use(passport.initialize());

// Routes
app.get("/api/test", (req, res) => {
  res.json({ message: "Hello from Backend! API is working." });
});

app.use("/auth", authRoutes);
app.use("/api/movies", movieRoutes);
app.use("/api/forum", forumRoutes);
app.use("/api/reviews", reviewRoutes);

// Placeholder for future routes
// import movieRoutes from './routes/movieRoutes.js'; // Ví dụ
// app.use('/api/movies', movieRoutes);

// Global Error Handler (Basic)
app.use((err, req, res, next) => {
  console.error("Global Error Handler:", err.message);
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || "Something went wrong!",
  });
});

app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
  console.log(`Google Auth URL: http://localhost:${PORT}/auth/google`);
});
