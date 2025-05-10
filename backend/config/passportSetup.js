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

      const newUser = {
        googleId: profile.id,
        displayName: profile.displayName,
        email:
          profile.emails && profile.emails[0] ? profile.emails[0].value : null, // Lấy email đầu tiên
        avatarUrl:
          profile.photos && profile.photos[0] ? profile.photos[0].value : null, // Lấy ảnh đầu tiên
        // username: có thể tạo từ email hoặc để trống ban đầu nếu không bắt buộc
      };

      try {
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          // Nếu người dùng đã tồn tại, cập nhật thông tin nếu cần (ví dụ: avatar, displayName)
          // và gọi done
          if (
            user.displayName !== newUser.displayName ||
            user.avatarUrl !== newUser.avatarUrl
          ) {
            user.displayName = newUser.displayName;
            user.avatarUrl = newUser.avatarUrl;
            // Cập nhật email nếu nó thay đổi và chưa được sử dụng bởi người dùng khác
            if (newUser.email && user.email !== newUser.email) {
              const existingEmail = await User.findOne({
                email: newUser.email,
                _id: { $ne: user._id },
              });
              if (!existingEmail) {
                user.email = newUser.email;
              }
            }
            await user.save();
          }
          return done(null, user); // Người dùng đã tồn tại
        } else {
          // Nếu người dùng chưa có googleId, kiểm tra xem email từ Google đã tồn tại chưa
          if (newUser.email) {
            user = await User.findOne({ email: newUser.email });
            if (user) {
              // Email đã tồn tại, liên kết tài khoản Google này với user đó
              user.googleId = newUser.googleId;
              user.displayName = user.displayName || newUser.displayName; // Ưu tiên displayName đã có
              user.avatarUrl = user.avatarUrl || newUser.avatarUrl; // Ưu tiên avatarUrl đã có
              await user.save();
              return done(null, user);
            }
          }

          // Nếu không tìm thấy user qua googleId hoặc email, tạo user mới
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
