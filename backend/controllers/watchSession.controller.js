import asyncHandler from "express-async-handler";
import WatchSession from "../models/WatchSessionModel.js";
import MovieMetadata from "../models/MovieMetadataModel.js";

// @desc    Get user's continue watching list with pagination
// @route   GET /api/continue-watching
// @access  Private
export const getContinueWatching = asyncHandler(async (req, res) => {
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
    console.error("Get continue watching list error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách đang xem",
    });
  }
});

// @desc    Delete a watch session from history
// @route   DELETE /api/continue-watching/:id
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
// @route   POST /api/continue-watching/report
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

  try {
    const filter = {
      user: userId,
      movie: movieId,
      episodeSlug: episodeSlug || null,
    };

    const existingSession = await WatchSession.findOne(filter);

    if (existingSession) {
      existingSession.lastWatchedAt = new Date();
      await existingSession.save();
      return res.status(200).json({
        success: true,
        message: "Cập nhật lịch sử xem thành công.",
        data: existingSession,
      });
    }

    // Đây là lần đầu người dùng xem tập này -> Tạo lịch sử MỚI và TÍNH VIEW
    const newSession = await WatchSession.create({
      user: userId,
      movie: movieId,
      episodeSlug: episodeSlug || null,
      serverName: serverName,
    });

    // Tăng lượt xem cho phim
    await MovieMetadata.updateOne(
      { _id: movieId },
      { $inc: { appTotalViews: 1 } }
    );

    res.status(201).json({
      success: true,
      message: "Lịch sử xem đã được tạo và lượt xem đã được tính.",
      data: newSession,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(200).json({
        success: true,
        message: "Lịch sử xem đã tồn tại.",
      });
    }
    console.error("Report watch event error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi báo cáo sự kiện xem.",
    });
  }
});
