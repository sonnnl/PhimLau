import asyncHandler from "express-async-handler";
import WatchSession from "../models/WatchSessionModel.js";
import MovieMetadata from "../models/MovieMetadataModel.js";

// @desc    Get user's watch history with pagination
// @route   GET /api/watch-history
// @access  Private
export const getWatchHistory = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 18;
    const skip = (page - 1) * limit;

    const totalSessions = await WatchSession.countDocuments({ user: userId });

    const watchingSessions = await WatchSession.find({ user: userId })
      .sort({ lastWatchedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: "movie",
        model: "MovieMetadata",
      })
      .lean();

    const validSessions = watchingSessions.filter((session) => session.movie);

    res.json({
      success: true,
      data: validSessions,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalSessions / limit),
        totalItems: totalSessions,
      },
    });
  } catch (error) {
    console.error("Get watch history error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy lịch sử xem",
    });
  }
});

// @desc    Delete a watch session from history
// @route   DELETE /api/watch-history/:id
// @access  Private
export const deleteWatchSession = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const sessionId = req.params.id;

  try {
    const session = await WatchSession.findOne({
      _id: sessionId,
      user: userId,
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy session hoặc bạn không có quyền xóa.",
      });
    }

    await session.deleteOne();

    res.json({
      success: true,
      message: "Đã xóa khỏi lịch sử xem.",
    });
  } catch (error) {
    console.error("Delete watch session error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi xóa lịch sử xem.",
    });
  }
});

// @desc    Report a watch event for a movie episode (create or update session)
// @route   POST /api/watch-history/report
// @access  Private
export const reportWatchEvent = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { movieId, episodeSlug, serverName } = req.body;

  if (!movieId) {
    return res.status(400).json({
      success: false,
      message: "Thiếu thông tin movieId",
    });
  }

  const filter = {
    user: userId,
    movie: movieId,
    // Sử dụng `episodeSlug ?? null` để `''` (chuỗi rỗng) không bị chuyển thành `null`
    episodeSlug: episodeSlug ?? null,
  };

  try {
    // Cố gắng tạo một session mới trước tiên.
    // Nếu thành công, điều đó có nghĩa là người dùng lần đầu xem tập này.
    const newSession = await WatchSession.create({
      ...filter,
      serverName: serverName,
    });

    // Chỉ tăng lượt xem khi một session mới được tạo thành công.
    await MovieMetadata.updateOne(
      { _id: movieId },
      { $inc: { appTotalViews: 1 } }
    );

    return res.status(201).json({
      success: true,
      message: "Lịch sử xem đã được tạo và lượt xem đã được tính.",
      data: newSession,
    });
  } catch (error) {
    // Nếu lỗi có mã 11000, điều đó có nghĩa là đã có một bản ghi tồn tại (lỗi khóa trùng lặp).
    // Điều này có thể xảy ra trong hoạt động bình thường (người dùng xem lại) hoặc do race condition.
    if (error.code === 11000) {
      try {
        // Tìm bản ghi hiện có và cập nhật nó.
        const existingSession = await WatchSession.findOne(filter);
        if (existingSession) {
          existingSession.lastWatchedAt = new Date();
          if (serverName) {
            existingSession.serverName = serverName;
          }
          await existingSession.save();
          return res.status(200).json({
            success: true,
            message: "Cập nhật lịch sử xem thành công.",
            data: existingSession,
          });
        }
        // Nếu không tìm thấy (trường hợp hiếm), báo lỗi server.
        return res.status(500).json({
          success: false,
          message: "Lỗi không nhất quán khi cập nhật lịch sử.",
        });
      } catch (updateError) {
        console.error(
          "Error updating watch session after duplicate key:",
          updateError
        );
        return res.status(500).json({
          success: false,
          message: "Lỗi server khi cập nhật lịch sử xem.",
        });
      }
    }

    // Xử lý các lỗi không mong muốn khác.
    console.error("Report watch event error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi báo cáo sự kiện xem.",
    });
  }
});

// @desc    Get watched episode slugs for a specific movie
// @route   GET /api/watch-history/status/:movieId
// @access  Private
export const getMovieWatchStatus = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { movieId } = req.params;

  if (!movieId) {
    return res.status(400).json({
      success: false,
      message: "Thiếu thông tin movieId",
    });
  }

  try {
    const sessions = await WatchSession.find({
      user: userId,
      movie: movieId,
    })
      .select("episodeSlug -_id")
      .lean();

    const watchedSlugs = sessions.map((session) => session.episodeSlug);

    res.status(200).json({
      success: true,
      data: watchedSlugs,
    });
  } catch (error) {
    console.error("Get movie watch status error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy trạng thái xem phim.",
    });
  }
});
