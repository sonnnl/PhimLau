import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../models/UserModel.js";

const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Authentication middleware for Socket.IO
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth.token ||
        socket.handshake.headers.authorization?.split(" ")[1];

      if (!token) {
        return next(new Error("Authentication error: No token provided"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        return next(new Error("Authentication error: User not found"));
      }

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (error) {
      next(new Error("Authentication error: Invalid token"));
    }
  });

  // Connection handling
  io.on("connection", (socket) => {
    console.log(
      `🔌 User connected: ${socket.user.username} (${socket.userId})`
    );

    // Join user to their personal room
    socket.join(`user_${socket.userId}`);

    // Join admin room if user is admin
    if (socket.user.role === "admin") {
      socket.join("admin_room");
      console.log(`👑 Admin ${socket.user.username} joined admin room`);
    }

    // Send user connection status to admins
    socket.to("admin_room").emit("user_status", {
      userId: socket.userId,
      username: socket.user.username,
      status: "online",
      timestamp: new Date(),
    });

    // Handle notification read confirmation
    socket.on("notification_read", (data) => {
      console.log(
        `📖 User ${socket.userId} read notification ${data.notificationId}`
      );

      // Could emit back to admin about read status
      socket.to("admin_room").emit("notification_read_update", {
        notificationId: data.notificationId,
        userId: socket.userId,
        username: socket.user.username,
        readAt: new Date(),
      });
    });

    // Handle admin sending real-time test notification
    socket.on("admin_test_notification", (data) => {
      if (socket.user.role === "admin") {
        console.log(`📢 Admin test notification from ${socket.user.username}`);

        // Send test notification to all users
        io.emit("notification", {
          id: `test_${Date.now()}`,
          title: "🧪 Test Notification",
          message: data.message || "This is a test notification from admin",
          type: "info",
          metadata: {
            icon: "🧪",
            color: "blue",
          },
          createdAt: new Date(),
          isTest: true,
        });
      }
    });

    // Handle typing indicators for forum/chat
    socket.on("typing_start", (data) => {
      socket.to(data.room || "general").emit("user_typing", {
        userId: socket.userId,
        username: socket.user.username,
        typing: true,
      });
    });

    socket.on("typing_stop", (data) => {
      socket.to(data.room || "general").emit("user_typing", {
        userId: socket.userId,
        username: socket.user.username,
        typing: false,
      });
    });

    // Disconnect handling
    socket.on("disconnect", (reason) => {
      console.log(`❌ User disconnected: ${socket.user.username} (${reason})`);

      // Notify admins about user disconnect
      socket.to("admin_room").emit("user_status", {
        userId: socket.userId,
        username: socket.user.username,
        status: "offline",
        timestamp: new Date(),
        reason,
      });
    });

    // Error handling
    socket.on("error", (error) => {
      console.error(`🔥 Socket error for user ${socket.userId}:`, error);
    });
  });

  // Store io instance for use in controllers
  io.adminEmit = (event, data) => {
    io.to("admin_room").emit(event, data);
  };

  io.userEmit = (userId, event, data) => {
    io.to(`user_${userId}`).emit(event, data);
  };

  return io;
};

export default setupSocket;
