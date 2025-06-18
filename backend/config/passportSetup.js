import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import mongoose from "mongoose"; // Cần thiết nếu User model chưa được load ở đâu đó
import User from "../models/UserModel.js"; // Đường dẫn đến User model của bạn
import dotenv from "dotenv";

dotenv.config(); // Đảm bảo các biến môi trường đã được load

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || "/auth/google/callback", // Nên đặt trong .env
      // proxy: true, // Bỏ comment nếu app của bạn nằm sau một proxy (ví dụ Heroku)
    },
    async (accessToken, refreshToken, profile, done) => {
      // accessToken: dùng để gọi các API của Google thay mặt người dùng (nếu cần)
      // refreshToken: dùng để lấy accessToken mới khi hết hạn (nếu Google cung cấp)
      // profile: chứa thông tin người dùng từ Google

      // console.log('Google Profile:', profile);

      // Tạo username từ email nếu có
      const generateUsernameFromEmail = (email) => {
        if (!email) return null;
        return email
          .split("@")[0]
          .toLowerCase()
          .replace(/[^a-zA-Z0-9]/g, "");
      };

      const email =
        profile.emails && profile.emails[0] ? profile.emails[0].value : null;
      const baseUsername =
        generateUsernameFromEmail(email) || `user_${profile.id}`;

      const newUser = {
        googleId: profile.id,
        displayName: profile.displayName,
        email: email,
        avatarUrl:
          profile.photos && profile.photos[0] ? profile.photos[0].value : null,
        username: baseUsername,
        isGoogleAccount: true, // Đánh dấu là Google account
        isEmailVerified: true, // Google account tự động verify email
      };

      try {
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          // Tự động mở khóa nếu hết hạn
          if (
            user.status === "suspended" &&
            user.suspensionExpires &&
            new Date() > user.suspensionExpires
          ) {
            console.log(
              `Google login: User ${user.username} suspension expired. Reactivating.`
            );
            user.status = "active";
            user.suspensionExpires = null;
            user.suspensionReason = null;
            await user.save();
          }

          // Kiểm tra trạng thái tài khoản trước khi cho phép đăng nhập
          if (user.status === "suspended") {
            const formattedDate = new Date(
              user.suspensionExpires
            ).toLocaleString("vi-VN");
            return done(null, false, {
              message: `Tài khoản của bạn đã bị tạm khóa cho đến ${formattedDate}.`,
              accountStatus: "suspended",
              reason: user.suspensionReason,
              expires: user.suspensionExpires.toISOString(), // Gửi dưới dạng ISO string
            });
          }

          if (user.status === "banned") {
            return done(null, false, {
              message: "Tài khoản của bạn đã bị cấm vĩnh viễn.",
              accountStatus: "banned",
            });
          }

          if (user.status === "inactive") {
            return done(null, false, {
              message: "Tài khoản của bạn đã bị vô hiệu hóa.",
              accountStatus: "inactive",
            });
          }

          // Nếu người dùng đã tồn tại và trạng thái active, chỉ cập nhật thông tin nếu user chưa tùy chỉnh
          let needsUpdate = false;

          // Chỉ cập nhật nếu user chưa tùy chỉnh profile
          if (!user.hasCustomizedProfile) {
            // Cập nhật displayName nếu user chưa có hoặc trống
            if (!user.displayName || user.displayName.trim() === "") {
              user.displayName = newUser.displayName;
              needsUpdate = true;
            }

            // Cập nhật avatarUrl nếu user chưa có hoặc là avatar mặc định
            if (
              !user.avatarUrl ||
              user.avatarUrl.includes("pravatar.cc") ||
              user.avatarUrl.includes("default")
            ) {
              user.avatarUrl = newUser.avatarUrl;
              needsUpdate = true;
            }
          }

          // Cập nhật email nếu nó thay đổi và chưa được sử dụng bởi người dùng khác
          if (newUser.email && user.email !== newUser.email) {
            const existingEmail = await User.findOne({
              email: newUser.email,
              _id: { $ne: user._id },
            });
            if (!existingEmail) {
              user.email = newUser.email;
              needsUpdate = true;
            }
          }

          if (needsUpdate) {
            await user.save();
          }
          return done(null, user); // Người dùng đã tồn tại và active
        } else {
          // Nếu người dùng chưa có googleId, kiểm tra xem email từ Google đã tồn tại chưa
          if (newUser.email) {
            user = await User.findOne({ email: newUser.email });
            if (user) {
              // Kiểm tra trạng thái tài khoản trước khi liên kết
              if (user.status === "suspended") {
                return done(null, false, {
                  message:
                    "Tài khoản của bạn đã bị tạm khóa. Vui lòng liên hệ admin.",
                  accountStatus: "suspended",
                });
              }

              if (user.status === "banned") {
                return done(null, false, {
                  message: "Tài khoản của bạn đã bị cấm vĩnh viễn.",
                  accountStatus: "banned",
                });
              }

              if (user.status === "inactive") {
                return done(null, false, {
                  message: "Tài khoản của bạn đã bị vô hiệu hóa.",
                  accountStatus: "inactive",
                });
              }

              // Email đã tồn tại và trạng thái active, liên kết tài khoản Google này với user đó
              user.googleId = newUser.googleId;
              user.isGoogleAccount = true;
              user.isEmailVerified = true;

              // Chỉ cập nhật nếu user chưa tùy chỉnh profile
              if (!user.hasCustomizedProfile) {
                user.displayName = user.displayName || newUser.displayName;
                user.avatarUrl = user.avatarUrl || newUser.avatarUrl;
              }

              await user.save();
              return done(null, user);
            }
          }

          // Nếu không tìm thấy user qua googleId hoặc email, tạo user mới
          // Kiểm tra và tạo username unique
          let finalUsername = newUser.username;
          let counter = 1;

          while (await User.findOne({ username: finalUsername })) {
            finalUsername = `${newUser.username}${counter}`;
            counter++;
          }

          newUser.username = finalUsername;
          user = await User.create(newUser);
          return done(null, user); // Tạo người dùng mới thành công
        }
      } catch (err) {
        console.error("Error in Google Strategy:", err);
        return done(err, false, {
          message: "Something went wrong during Google authentication.",
        });
      }
    }
  )
);

// Serialize user để lưu vào session (nếu dùng session)
// Đối với JWT, chúng ta không thực sự dùng session của Passport theo cách truyền thống,
// nhưng các hàm này vẫn cần thiết cho một số luồng hoạt động của Passport.
passport.serializeUser((user, done) => {
  done(null, user.id); // Lưu user.id (từ MongoDB) vào session
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user); // Lấy user từ DB bằng id đã lưu trong session
  } catch (err) {
    done(err, null);
  }
});

// Không cần export gì từ file này, chỉ cần import nó một lần trong server.js để Passport được cấu hình.
