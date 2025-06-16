import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Tạo transporter cho Gmail
const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // App Password từ Google
    },
  });
};

// Gửi email xác nhận
export const sendVerificationEmail = async (
  email,
  verificationToken,
  username
) => {
  try {
    const transporter = createTransporter();

    const verificationUrl = `${
      process.env.FRONTEND_URL || "http://localhost:3000"
    }/verify-email/${verificationToken}`;

    const mailOptions = {
      from: {
        name: "Movie Review App",
        address: process.env.EMAIL_USER,
      },
      to: email,
      subject: "Xác nhận tài khoản - Movie Review App",
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #333; margin-bottom: 10px;">🎬 Movie Review App</h1>
            <h2 style="color: #666; font-weight: normal;">Xác nhận tài khoản của bạn</h2>
          </div>
          
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <p style="color: #333; font-size: 16px; line-height: 1.5; margin-bottom: 15px;">
              Xin chào <strong>${username}</strong>,
            </p>
            <p style="color: #333; font-size: 16px; line-height: 1.5; margin-bottom: 15px;">
              Cảm ơn bạn đã đăng ký tài khoản tại Movie Review App! Để hoàn tất quá trình đăng ký, 
              vui lòng click vào nút bên dưới để xác nhận email của bạn.
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="display: inline-block; padding: 12px 30px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
              Xác nhận tài khoản
            </a>
          </div>
          
          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0;">
            <p style="color: #856404; margin: 0; font-size: 14px;">
              ⚠️ <strong>Lưu ý:</strong> Link xác nhận này sẽ hết hạn sau 24 giờ.
            </p>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 14px; line-height: 1.5;">
              Nếu bạn không thể click vào nút trên, hãy copy và paste link sau vào trình duyệt:
            </p>
            <p style="color: #007bff; font-size: 14px; word-break: break-all;">
              ${verificationUrl}
            </p>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              Nếu bạn không tạo tài khoản này, vui lòng bỏ qua email này.
            </p>
            <p style="color: #999; font-size: 12px; margin: 5px 0 0 0;">
              © 2024 Movie Review App. All rights reserved.
            </p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending verification email:", error);
    return { success: false, error: error.message };
  }
};

// Gửi email reset password
export const sendPasswordResetEmail = async (email, resetToken, username) => {
  try {
    const transporter = createTransporter();

    const resetUrl = `${
      process.env.FRONTEND_URL || "http://localhost:3000"
    }/reset-password/${resetToken}`;

    const mailOptions = {
      from: {
        name: "Movie Review App",
        address: process.env.EMAIL_USER,
      },
      to: email,
      subject: "Đặt lại mật khẩu - Movie Review App",
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #333; margin-bottom: 10px;">🎬 Movie Review App</h1>
            <h2 style="color: #dc3545; font-weight: normal;">Đặt lại mật khẩu</h2>
          </div>
          
          <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 5px; padding: 20px; margin-bottom: 20px;">
            <p style="color: #721c24; margin: 0; font-size: 14px; text-align: center;">
              ⚠️ <strong>Cảnh báo bảo mật:</strong> Chỉ đặt lại mật khẩu nếu bạn đã yêu cầu.
            </p>
          </div>
          
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <p style="color: #333; font-size: 16px; line-height: 1.5; margin-bottom: 15px;">
              Xin chào <strong>${username}</strong>,
            </p>
            <p style="color: #333; font-size: 16px; line-height: 1.5; margin-bottom: 15px;">
              Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. 
              Click vào nút bên dưới để tạo mật khẩu mới.
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="display: inline-block; padding: 12px 30px; background-color: #dc3545; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
              Đặt lại mật khẩu
            </a>
          </div>
          
          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0;">
            <p style="color: #856404; margin: 0; font-size: 14px;">
              ⏰ <strong>Thời gian hết hạn:</strong> Link này sẽ hết hạn sau 10 phút.
            </p>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 14px; line-height: 1.5;">
              Nếu bạn không thể click vào nút trên, hãy copy và paste link sau vào trình duyệt:
            </p>
            <p style="color: #dc3545; font-size: 14px; word-break: break-all;">
              ${resetUrl}
            </p>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này và bảo vệ tài khoản của bạn.
            </p>
            <p style="color: #999; font-size: 12px; margin: 5px 0 0 0;">
              © 2024 Movie Review App. All rights reserved.
            </p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Password reset email sent successfully:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending password reset email:", error);
    return { success: false, error: error.message };
  }
};

// Gửi email thông báo đổi mật khẩu thành công
export const sendPasswordResetSuccessEmail = async (email, username) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: {
        name: "Movie Review App",
        address: process.env.EMAIL_USER,
      },
      to: email,
      subject: "Mật khẩu đã được thay đổi - Movie Review App",
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #333; margin-bottom: 10px;">🎬 Movie Review App</h1>
            <h2 style="color: #28a745; font-weight: normal;">Mật khẩu đã được thay đổi</h2>
          </div>
          
          <div style="background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 5px; padding: 20px; margin-bottom: 20px;">
            <p style="color: #155724; font-size: 16px; line-height: 1.5; margin: 0; text-align: center;">
              ✅ <strong>Mật khẩu của bạn đã được thay đổi thành công!</strong>
            </p>
          </div>
          
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <p style="color: #333; font-size: 16px; line-height: 1.5; margin-bottom: 15px;">
              Xin chào <strong>${username}</strong>,
            </p>
            <p style="color: #333; font-size: 16px; line-height: 1.5; margin-bottom: 15px;">
              Đây là thông báo xác nhận rằng mật khẩu cho tài khoản Movie Review App của bạn đã được thay đổi thành công.
            </p>
            <p style="color: #333; font-size: 16px; line-height: 1.5; margin-bottom: 15px;">
              <strong>Thời gian thay đổi:</strong> ${new Date().toLocaleString(
                "vi-VN"
              )}
            </p>
          </div>
          
          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0;">
            <p style="color: #856404; margin: 0; font-size: 14px;">
              🔒 <strong>Bảo mật:</strong> Nếu bạn không thực hiện thay đổi này, hãy liên hệ với chúng tôi ngay lập tức.
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${
              process.env.FRONTEND_URL || "http://localhost:3000"
            }/login" 
               style="display: inline-block; padding: 12px 30px; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
              Đăng nhập ngay
            </a>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              Cảm ơn bạn đã sử dụng Movie Review App!
            </p>
            <p style="color: #999; font-size: 12px; margin: 5px 0 0 0;">
              © 2024 Movie Review App. All rights reserved.
            </p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(
      "Password reset success email sent successfully:",
      info.messageId
    );
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending password reset success email:", error);
    return { success: false, error: error.message };
  }
};

// Gửi email thông báo xác nhận thành công
export const sendWelcomeEmail = async (email, username) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: {
        name: "Movie Review App",
        address: process.env.EMAIL_USER,
      },
      to: email,
      subject: "Chào mừng đến với Movie Review App! 🎉",
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #333; margin-bottom: 10px;">🎬 Movie Review App</h1>
            <h2 style="color: #28a745; font-weight: normal;">Chào mừng bạn!</h2>
          </div>
          
          <div style="background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 5px; padding: 20px; margin-bottom: 20px;">
            <p style="color: #155724; font-size: 16px; line-height: 1.5; margin: 0; text-align: center;">
              🎉 <strong>Tài khoản của bạn đã được xác nhận thành công!</strong>
            </p>
          </div>
          
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <p style="color: #333; font-size: 16px; line-height: 1.5; margin-bottom: 15px;">
              Xin chào <strong>${username}</strong>,
            </p>
            <p style="color: #333; font-size: 16px; line-height: 1.5; margin-bottom: 15px;">
              Chào mừng bạn đến với Movie Review App! Bây giờ bạn có thể:
            </p>
            <ul style="color: #333; font-size: 16px; line-height: 1.8; padding-left: 20px;">
              <li>Đăng nhập vào tài khoản của bạn</li>
              <li>Khám phá các bộ phim mới nhất</li>
              <li>Đọc và viết đánh giá phim</li>
              <li>Tham gia thảo luận với cộng đồng</li>
              <li>Tạo danh sách phim yêu thích</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${
              process.env.FRONTEND_URL || "http://localhost:3000"
            }/login" 
               style="display: inline-block; padding: 12px 30px; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
              Đăng nhập ngay
            </a>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              Cảm ơn bạn đã tham gia cộng đồng Movie Review App!
            </p>
            <p style="color: #999; font-size: 12px; margin: 5px 0 0 0;">
              © 2024 Movie Review App. All rights reserved.
            </p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Welcome email sent successfully:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending welcome email:", error);
    return { success: false, error: error.message };
  }
};
