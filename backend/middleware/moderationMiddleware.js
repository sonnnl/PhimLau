import User from "../models/UserModel.js";

// Middleware kiểm tra user bị suspended/banned
export const checkUserStatus = async (req, res, next) => {
  try {
    if (!req.user) {
      return next();
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(401).json({
        message: "Tài khoản không tồn tại",
      });
    }

    // Kiểm tra ban
    if (user.status === "banned") {
      return res.status(403).json({
        message: "Tài khoản của bạn đã bị cấm vĩnh viễn",
        banReason: user.banReason,
        bannedAt: user.bannedAt,
        status: "banned",
      });
    }

    // Kiểm tra suspension và tự động unsuspend nếu hết hạn
    if (user.status === "suspended") {
      if (user.suspensionExpires && new Date() > user.suspensionExpires) {
        // Hết hạn suspension, tự động kích hoạt lại
        user.status = "active";
        user.suspendedBy = undefined;
        user.suspendedAt = undefined;
        user.suspensionReason = undefined;
        user.suspensionExpires = undefined;
        await user.save();

        console.log(`Auto-unsuspended user: ${user.email}`);
        req.user = user;
        return next();
      } else {
        const daysLeft = user.suspensionExpires
          ? Math.ceil(
              (user.suspensionExpires - new Date()) / (1000 * 60 * 60 * 24)
            )
          : "không xác định";

        return res.status(403).json({
          message: "Tài khoản của bạn đang bị tạm khóa",
          suspensionReason: user.suspensionReason,
          suspendedAt: user.suspendedAt,
          suspensionExpires: user.suspensionExpires,
          daysLeft: daysLeft,
          status: "suspended",
        });
      }
    }

    // Kiểm tra inactive
    if (user.status === "inactive") {
      return res.status(403).json({
        message: "Tài khoản của bạn đã bị vô hiệu hóa",
        status: "inactive",
      });
    }

    // User status OK
    req.user = user;
    next();
  } catch (error) {
    console.error("Error checking user status:", error);
    res.status(500).json({
      message: "Lỗi server khi kiểm tra trạng thái tài khoản",
    });
  }
};

// Middleware kiểm tra quyền post trong forum (cho các action post thread/reply)
export const checkForumPostPermission = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Vui lòng đăng nhập để thực hiện hành động này",
      });
    }

    // Đã check user status ở middleware trước rồi
    if (req.user.status !== "active") {
      return res.status(403).json({
        message: "Tài khoản của bạn không có quyền đăng bài",
        status: req.user.status,
      });
    }

    next();
  } catch (error) {
    console.error("Error checking forum post permission:", error);
    res.status(500).json({
      message: "Lỗi server khi kiểm tra quyền đăng bài",
    });
  }
};

// Middleware kiểm tra có phải admin không
export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      message: "Bạn không có quyền truy cập trang admin",
    });
  }
  next();
};
