import asyncHandler from "express-async-handler";
import ForumCategory from "../models/ForumCategory.js";
import ForumThread from "../models/ForumThread.js";
import ForumReply from "../models/ForumReply.js";
import ForumReport from "../models/ForumReport.js"; // ✅ Import ForumReport model
import User from "../models/UserModel.js"; // 🔧 FIX: Sử dụng UserModel.js thay vì User.js
import Notification from "../models/NotificationModel.js"; // ✅ Import Notification model
import MovieMetadata from "../models/MovieMetadataModel.js"; // ✅ Import MovieMetadata model
import axios from "axios"; // ✅ Import axios for API calls
import { analyzeContent } from "../utils/autoModerationUtils.js";
import {
  getOrCreateMovieMetadata,
  getMovieTypeDisplay,
  getOptimizedPosterUrl,
} from "../utils/movieUtils.js";

// @desc    Get all forum categories
// @route   GET /api/forum/categories
// @access  Public
const getForumCategories = asyncHandler(async (req, res) => {
  // ✅ SIMPLE: Chỉ business logic, middleware handle cache
  const categories = await ForumCategory.find({ isActive: true })
    .select("name slug description icon color order threadCount")
    .sort({ order: 1 })
    .lean();

  res.status(200).json({
    success: true,
    data: categories,
  });
});

// @desc    Tạo danh mục mới (chỉ admin)
// @route   POST /api/forum/categories
// @access  Private/Admin
const createCategory = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (!name) {
    res.status(400);
    throw new Error("Vui lòng nhập tên danh mục");
  }

  const category = await ForumCategory.create({
    name,
    description,
    createdBy: req.user._id,
  });

  res.status(201).json(category);
});

// @desc    Get forum threads with pagination and filters
// @route   GET /api/forum/threads
// @access  Public
const getForumThreadsWithPagination = asyncHandler(async (req, res) => {
  const currentPage = parseInt(req.query.page, 10) || 1;
  const threadsPerPage = Math.min(parseInt(req.query.limit, 10) || 15, 50);

  // ✅ SIMPLE: Chỉ business logic, middleware handle cache
  let mongoFilter = {
    moderationStatus: "approved",
    isDeleted: false,
  };

  // 🔧 FIX: Convert category slug to ObjectId
  if (req.query.category) {
    try {
      // Find category by slug to get ObjectId
      const categoryDoc = await ForumCategory.findOne({
        slug: req.query.category,
        isActive: true,
      })
        .select("_id")
        .lean();

      if (categoryDoc) {
        mongoFilter.category = categoryDoc._id;
      } else {
        // Category not found, return empty result
        return res.status(200).json({
          success: true,
          threads: [],
          pagination: {
            currentPage,
            totalPages: 0,
            totalItems: 0,
            limit: threadsPerPage,
          },
        });
      }
    } catch (error) {
      console.error("❌ Error finding category:", error);
      // If error, continue without category filter
    }
  }

  const skip = (currentPage - 1) * threadsPerPage;

  // Execute queries
  const [threads, totalThreads] = await Promise.all([
    ForumThread.find(mongoFilter)
      .populate("author", "displayName avatarUrl")
      .populate("category", "name slug")
      .populate("lastReplyAuthor", "displayName avatarUrl")
      .sort({ isPinned: -1, lastReplyTime: -1 })
      .skip(skip)
      .limit(threadsPerPage)
      .lean(),
    ForumThread.countDocuments(mongoFilter),
  ]);

  const totalPages = Math.ceil(totalThreads / threadsPerPage);

  res.status(200).json({
    success: true,
    threads,
    pagination: {
      currentPage,
      totalPages,
      totalItems: totalThreads,
      limit: threadsPerPage,
    },
  });
});

// @desc    Lấy chi tiết một chủ đề bằng slug
// @route   GET /api/forum/threads/:slug
// @access  Public
const getThreadBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const page = parseInt(req.query.page, 10) || 1;
  const replyLimit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * replyLimit;

  // ===== 🔍 TÌM THREAD THEO SLUG =====
  // 🚀 IMPROVED: Tìm thread trước, sau đó kiểm tra quyền xem
  const thread = await ForumThread.findOne({
    slug,
    isDeleted: false, // ✅ Không hiển thị thread đã xóa
  })
    .populate("author", "displayName avatarUrl")
    .populate({
      path: "category",
      select: "name slug isActive",
      match: { isActive: true }, // Chỉ populate nếu category đang hoạt động
    })
    .populate("lastReplyAuthor", "displayName avatarUrl");

  // 🔍 DETAILED ERROR HANDLING
  if (!thread) {
    res.status(404);
    throw new Error("Chủ đề không tồn tại hoặc đã bị xóa");
  }

  if (!thread.category) {
    res.status(404);
    throw new Error("Danh mục của chủ đề đã bị vô hiệu hóa");
  }

  // 🛡️ PERMISSION CHECK: Kiểm tra quyền xem thread
  const isAdmin = req.user && req.user.role === "admin";
  const isAuthor =
    req.user && req.user._id.toString() === thread.author._id.toString();

  // Nếu thread đã approved → tất cả đều xem được
  // Nếu thread pending → chỉ admin và tác giả xem được
  // Nếu thread rejected → chỉ admin và tác giả xem được
  if (thread.moderationStatus !== "approved") {
    if (!isAdmin && !isAuthor) {
      res.status(403);
      throw new Error(
        `Chủ đề đang ${
          thread.moderationStatus === "pending"
            ? "chờ kiểm duyệt"
            : "bị từ chối"
        } và chỉ tác giả hoặc admin mới có thể xem`
      );
    }
  }

  // ===== 🎬 POPULATE MOVIE METADATA WITH FRESH DATA =====
  // If the thread has movie metadata, fetch the latest data for each movie
  if (thread && thread.movieMetadata && thread.movieMetadata.length > 0) {
    // Extract all movie IDs from the thread's metadata
    const movieIds = thread.movieMetadata.map((meta) => meta.movieId);

    // Fetch all the corresponding full movie documents from the database
    const freshMovies = await MovieMetadata.find({
      _id: { $in: movieIds },
    }).lean();

    // Create a map for quick lookup: { movieId -> movieDocument }
    const movieMap = freshMovies.reduce((map, movie) => {
      map[movie._id.toString()] = movie;
      return map;
    }, {});

    // Replace the stale metadata with the fresh, full movie data
    thread.movieMetadata = thread.movieMetadata.map((meta) => {
      const freshData = movieMap[meta.movieId];
      if (freshData) {
        return {
          ...meta.toObject(), // Keep original data like _id
          movieId: freshData._id,
          movieSlug: freshData.slug,
          movieTitle: freshData.name,
          moviePosterUrl: freshData.posterUrl,
          movieType: freshData.type,
          movieYear: freshData.year,
          appAverageRating: freshData.appAverageRating || 0,
          appRatingCount: freshData.appRatingCount || 0,
          appTotalViews: freshData.appTotalViews || 0,
          appTotalFavorites: freshData.appTotalFavorites || 0,
        };
      }
      return meta; // Fallback to stale data if not found for some reason
    });
  }

  // ===== 📈 TĂNG VIEW COUNT (chỉ với approved threads) =====
  if (thread.moderationStatus === "approved") {
    await ForumThread.findByIdAndUpdate(thread._id, {
      $inc: { views: 1 },
    });
  }

  // ===== 💬 LẤY REPLIES VỚI PHÂN TRANG - OPTIMIZED =====
  // 🚀 PERFORMANCE: Sử dụng aggregation pipeline cho replies
  const repliesAggregation = [
    // Stage 1: Match replies for this thread
    {
      $match: {
        thread: thread._id,
        moderationStatus: "approved",
        isDeleted: false,
      },
    },

    // Stage 2: Lookup author information
    {
      $lookup: {
        from: "users",
        localField: "author",
        foreignField: "_id",
        as: "author",
        pipeline: [{ $project: { displayName: 1, avatarUrl: 1 } }],
      },
    },

    // Stage 3: Lookup parent reply information
    {
      $lookup: {
        from: "forumreplies",
        localField: "parentReply",
        foreignField: "_id",
        as: "parentReply",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "author",
              foreignField: "_id",
              as: "author",
              pipeline: [{ $project: { displayName: 1, avatarUrl: 1 } }],
            },
          },
          {
            $addFields: {
              author: { $arrayElemAt: ["$author", 0] },
            },
          },
          { $project: { content: 1, author: 1, isDeleted: 1 } },
        ],
      },
    },

    // Stage 4: Clean up array fields
    {
      $addFields: {
        author: { $arrayElemAt: ["$author", 0] },
        parentReply: { $arrayElemAt: ["$parentReply", 0] },
      },
    },

    // Stage 5: Sort by creation time
    {
      $sort: { createdAt: 1 },
    },

    // Stage 6: Paginate with facet
    {
      $facet: {
        totalCount: [{ $count: "count" }],
        paginatedReplies: [{ $skip: skip }, { $limit: replyLimit }],
      },
    },
  ];

  const [repliesResult] = await ForumReply.aggregate(repliesAggregation);

  const replies = repliesResult.paginatedReplies || [];
  const totalReplies = repliesResult.totalCount[0]?.count || 0;

  res.status(200).json({
    success: true,
    thread,
    replies: {
      data: replies,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalReplies / replyLimit),
        totalItems: totalReplies,
        limit: replyLimit,
      },
    },
  });
});

// 🔔 FUNCTION: Tạo notification cho admin khi có thread mới
const createThreadNotificationForAdmin = async (thread, moderationStatus) => {
  try {
    // 🚀 OPTIMIZATION: Sử dụng lean() để giảm memory usage
    const admins = await User.find({ role: "admin" }).select("_id").lean();

    if (admins.length === 0) {
      // Không tìm thấy admin để gửi thông báo
      return;
    }

    // 🛡️ SECURITY: Giới hạn số lượng admin notification để tránh spam
    const MAX_ADMIN_NOTIFICATIONS = 20;
    const limitedAdmins = admins.slice(0, MAX_ADMIN_NOTIFICATIONS);

    const notificationPromises = limitedAdmins.map((admin) => {
      let message, type, priority;

      if (moderationStatus === "pending") {
        message = `Bài viết mới cần kiểm duyệt: "${
          thread.title?.substring(0, 50) || "Untitled"
        }${thread.title?.length > 50 ? "..." : ""}"`; // 🛡️ Limit title length
        type = "moderation_required";
        priority = "high";
      } else {
        message = `Bài viết mới đã được đăng: "${
          thread.title?.substring(0, 50) || "Untitled"
        }${thread.title?.length > 50 ? "..." : ""}"`;
        type = "new_post";
        priority = "medium";
      }

      return Notification.create({
        recipient: admin._id,
        title: "Bài viết mới trong diễn đàn",
        message: message,
        type: type,
        priority: priority,
        relatedModel: "ForumThread",
        relatedId: thread._id,
        metadata: {
          threadSlug: thread.slug,
          authorName: thread.author?.displayName?.substring(0, 30) || "Ẩn danh", // 🛡️ Limit author name
          moderationStatus: moderationStatus,
        },
        // 🗑️ AUTO-EXPIRE: Tự động xóa notification sau 30 ngày
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });
    });

    // 🚀 PERFORMANCE: Sử dụng Promise.allSettled thay vì Promise.all để tránh fail toàn bộ
    const results = await Promise.allSettled(notificationPromises);

    const successCount = results.filter(
      (result) => result.status === "fulfilled"
    ).length;
    const errorCount = results.filter(
      (result) => result.status === "rejected"
    ).length;

    console.log(
      `✅ Created thread notifications: ${successCount} success, ${errorCount} failed`
    );

    // Log errors if any
    if (errorCount > 0) {
      const errors = results
        .filter((result) => result.status === "rejected")
        .map((result) => result.reason);
      console.error("❌ Some notification creation failed:", errors);
    }
  } catch (error) {
    console.error("❌ Error creating thread notification for admin:", error);
    // 🛡️ Don't throw error to prevent thread creation failure
  }
};

// @desc    Tạo chủ đề mới với hệ thống HYBRID MODERATION
// @route   POST /api/forum/threads
// @access  Private (Logged in users)
const createThread = asyncHandler(async (req, res) => {
  const { title, content, categoryId, movieMetadata, isMovieDiscussion } =
    req.body;

  // ===== 🛡️ ENHANCED VALIDATION =====
  if (!title || !content || !categoryId) {
    res.status(400);
    throw new Error("Vui lòng cung cấp đầy đủ tiêu đề, nội dung và danh mục");
  }

  // 🛡️ SECURITY: Validate input lengths
  if (title.length < 5 || title.length > 200) {
    res.status(400);
    throw new Error("Tiêu đề phải có độ dài từ 5-200 ký tự");
  }

  if (content.length < 10 || content.length > 10000) {
    res.status(400);
    throw new Error("Nội dung phải có độ dài từ 10-10000 ký tự");
  }

  // ===== 🎬 MOVIE METADATA VALIDATION (supports multiple movies) =====
  let processedMovieMetadata = [];

  if (
    movieMetadata &&
    Array.isArray(movieMetadata) &&
    movieMetadata.length > 0
  ) {
    try {
      // Process each movie in the array
      for (const movie of movieMetadata) {
        if (!movie.movieId) continue;

        // Use the centralized utility function to get or create the basic movie doc
        const basicMovieDoc = await getOrCreateMovieMetadata({
          _id: movie.movieId,
          // Pass other details in case creation is needed
          slug: movie.movieSlug,
          name: movie.movieTitle,
          poster_url: movie.moviePosterUrl,
          type: movie.movieType,
          year: movie.movieYear,
          category: movie.category,
        });

        if (basicMovieDoc) {
          // Now, fetch the full document from our DB to get all stats
          const fullMovieDoc = await MovieMetadata.findById(
            basicMovieDoc._id
          ).lean();

          if (fullMovieDoc) {
            processedMovieMetadata.push({
              movieId: fullMovieDoc._id.toString(), // Ensure it's a string
              movieSlug: fullMovieDoc.slug,
              movieTitle:
                fullMovieDoc.name?.substring(0, 200) || "Unknown Movie",
              moviePosterUrl: fullMovieDoc.posterUrl,
              movieType: fullMovieDoc.type,
              movieYear: fullMovieDoc.year,
              appAverageRating: fullMovieDoc.appAverageRating || 0,
              appRatingCount: fullMovieDoc.appRatingCount || 0,
              appTotalViews: fullMovieDoc.appTotalViews || 0,
              appTotalFavorites: fullMovieDoc.appTotalFavorites || 0,
            });
          }
        }
      }

      console.log(
        `🎬 Processed ${processedMovieMetadata.length} movies:`,
        processedMovieMetadata.map((m) => m.movieTitle).join(", ")
      );
    } catch (movieError) {
      console.error("❌ Movie validation error:", movieError);
      res.status(400);
      throw new Error("Không thể xác thực thông tin phim");
    }
  }

  // 🛡️ SECURITY: Sanitize input data
  const sanitizedTitle = title.trim().replace(/\s+/g, " "); // Remove excessive whitespace
  const sanitizedContent = content.trim();

  // 🛡️ SECURITY: Check for spam patterns
  const suspiciousPatterns = [
    /(.)\1{10,}/g, // Excessive character repetition
    /https?:\/\/[^\s]{10,}/g, // Long URLs
    /\b\d{10,}\b/g, // Long numbers (phone numbers, etc.)
  ];

  const combinedText = `${sanitizedTitle} ${sanitizedContent}`;
  const hasSuspiciousPattern = suspiciousPatterns.some((pattern) =>
    pattern.test(combinedText)
  );

  if (hasSuspiciousPattern) {
    // Phát hiện pattern đáng ngờ - để hệ thống moderation xử lý
  }

  // 🛡️ RATE LIMITING: Check user's recent thread creation
  const recentThreads = await ForumThread.countDocuments({
    author: req.user._id,
    createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) }, // Last hour
  });

  if (recentThreads >= 5) {
    res.status(429);
    throw new Error(
      "Bạn đã tạo quá nhiều bài viết trong giờ qua. Vui lòng thử lại sau."
    );
  }

  // ===== 📁 KIỂM TRA CATEGORY TỒN TẠI VÀ HOẠT ĐỘNG =====
  const categoryExists = await ForumCategory.findById(categoryId);
  if (!categoryExists) {
    res.status(404);
    throw new Error("Danh mục được chọn không tồn tại");
  }

  // ===== 🔐 KIỂM TRA CATEGORY CÓ HOẠT ĐỘNG KHÔNG =====
  if (!categoryExists.isActive) {
    res.status(403);
    throw new Error(
      "Danh mục này hiện đang bị vô hiệu hóa và không thể tạo bài viết mới"
    );
  }

  // ===== 🤖 AUTO-MODERATION ANALYSIS FOR THREAD =====
  // Lấy thông tin user với forumStats để đưa ra quyết định moderation
  const user = await User.findById(req.user._id);

  // Phân tích nội dung thread (title + content) để đánh giá rủi ro
  const contentAnalysis = analyzeContent(sanitizedTitle, sanitizedContent);

  // ===== 🛡️ VALIDATION FOR CONTENT ANALYSIS =====
  // Fallback nếu content analysis thất bại
  if (!contentAnalysis || contentAnalysis.error) {
    const fallbackAnalysis = {
      overallRisk: hasSuspiciousPattern ? "high" : "medium",
      combinedScore: hasSuspiciousPattern ? 0.8 : 0.5,
      recommendations: {
        action: "review",
        reason: "Content analysis failed - manual review required",
      },
    };
    contentAnalysis = fallbackAnalysis;
  }

  // ===== 🎯 LOGIC RA QUYẾT ĐỊNH MODERATION =====

  let moderationStatus;
  let autoApproved = false;
  let autoApprovalReason = null;
  let moderationNote = "";

  // BƯỚC 1: Kiểm tra vi phạm nghiêm trọng -> từ chối tự động
  if (contentAnalysis.shouldReject || contentAnalysis.combinedScore > 80) {
    moderationStatus = "rejected";
    moderationNote = `Tự động từ chối: ${contentAnalysis.recommendations.reason}`;

    // Cập nhật thống kê vi phạm của user
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { "forumStats.reportsReceived": 1 },
    });

    res.status(400);
    throw new Error(
      `Bài viết bị từ chối: ${contentAnalysis.recommendations.reason}`
    );
  }

  // BƯỚC 2: Kiểm tra tự động phê duyệt (admin/moderator hoặc user tin cậy + nội dung an toàn)
  else if (user.role === "admin" || user.trustLevel === "moderator") {
    moderationStatus = "approved";
    autoApproved = true;
    autoApprovalReason = user.role === "admin" ? "admin" : "moderator"; // "admin" hoặc "moderator"
    moderationNote = `Tự động phê duyệt: Quyền ${
      user.role === "admin" ? "Admin" : "Moderator"
    }`;
  } else if (
    (user.trustLevel === "trusted" || user.autoApprovalEnabled) &&
    contentAnalysis.overallRisk === "low" &&
    contentAnalysis.combinedScore < 20
  ) {
    moderationStatus = "approved";
    autoApproved = true;
    autoApprovalReason = "trusted_user";
    moderationNote = "Tự động phê duyệt: User tin cậy + nội dung an toàn";
  }

  // BƯỚC 3: Các trường hợp khác cần kiểm duyệt thủ công
  else {
    moderationStatus = "pending";
    autoApproved = false;
    autoApprovalReason = null;

    // Generate detailed review note
    const userStats = user.forumStats || {};
    const postsCount = userStats.postsCount || 0;
    const riskLevel = contentAnalysis.overallRisk;
    const score = Math.round(contentAnalysis.combinedScore);

    if (postsCount < 5) {
      moderationNote = `Cần duyệt: User mới (${postsCount} bài) - Risk: ${riskLevel} (${score}/100)`;
    } else if (riskLevel !== "low") {
      moderationNote = `Cần duyệt: Nội dung có rủi ro ${riskLevel} (${score}/100) - ${contentAnalysis.recommendations.reason}`;
    } else {
      moderationNote = `Cần duyệt: User chưa đủ tin cậy - Risk: ${riskLevel} (${score}/100)`;
    }
  }

  console.log("✅ Moderation decision made:", {
    status: moderationStatus,
    autoApproved,
    reason: autoApprovalReason,
    note: moderationNote,
  });

  // ===== 🛡️ VALIDATE MODERATION CONSISTENCY =====
  const isApproved = moderationStatus === "approved";
  const validation = validateModerationConsistency(
    moderationStatus,
    isApproved,
    autoApproved
  );

  if (!validation.isValid) {
    console.error("🚨 Moderation validation failed:", validation.errors);
    res.status(500);
    throw new Error("Internal moderation logic error");
  }

  // ===== 💾 TẠO THREAD MỚI VỚI CONSISTENT DATA =====
  console.log("💾 Creating new thread with consistent moderation data...");

  // 🔄 TẠO THREAD VỚI SANITIZED DATA
  const thread = new ForumThread({
    title: sanitizedTitle,
    content: sanitizedContent,
    category: categoryId,
    author: req.user._id,
    lastReplyTime: Date.now(),

    // ===== 🎯 CONSISTENT MODERATION FIELDS =====
    moderationStatus, // "approved", "pending", or "rejected"
    isApproved: moderationStatus === "approved", // ✅ CONSISTENT with moderationStatus
    autoApproved, // true if auto-approved by system
    autoApprovalReason, // reason for auto-approval
    moderationNote, // detailed note for admins

    // ===== 🎬 MOVIE METADATA =====
    movieMetadata: processedMovieMetadata,
    isMovieDiscussion: isMovieDiscussion || processedMovieMetadata.length > 0,

    // ===== 📊 DEFAULT VALUES =====
    isLocked: false,
    isPinned: false,
    isDeleted: false,
    requiresEditing: false,
    views: 0,
    replyCount: 0,
    likeCount: 0,
    reportCount: 0,
    priority: 0,
    tags: [],
  });

  // 🚀 SAVE THREAD AND UPDATE STATS (without transaction for standalone MongoDB)
  let createdThread;

  try {
    // Save thread first
    createdThread = await thread.save();
    console.log("✅ Thread saved successfully");

    // Update user stats
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { "forumStats.postsCount": 1 },
      "forumStats.lastPostDate": new Date(),
    });
    console.log("📊 Updated user stats");

    // Update category thread count only if approved
    if (moderationStatus === "approved") {
      await ForumCategory.findByIdAndUpdate(categoryId, {
        $inc: { threadCount: 1 },
      });
      console.log("📈 Updated category thread count");
    }
  } catch (saveError) {
    console.error("❌ Error saving thread:", saveError);

    // Cleanup: Try to delete thread if it was created but other operations failed
    if (createdThread && createdThread._id) {
      try {
        await ForumThread.findByIdAndDelete(createdThread._id);
        console.log("🧹 Cleaned up partially created thread");
      } catch (cleanupError) {
        console.error("❌ Cleanup failed:", cleanupError);
      }
    }

    throw new Error("Không thể tạo bài viết. Vui lòng thử lại.");
  }

  // ===== 📤 POPULATE VÀ TRẢ VỀ KẾT QUẢ =====
  const populatedThread = await ForumThread.findById(createdThread._id)
    .populate("author", "displayName avatarUrl")
    .populate("category", "name slug");

  // Tạo notification cho admin (bất kể trạng thái)
  await createThreadNotificationForAdmin(populatedThread, moderationStatus);

  console.log("✅ Thread created successfully:", {
    id: createdThread._id,
    status: moderationStatus,
    autoApproved: autoApproved,
  });

  // ===== 📤 OPTIMIZED RESPONSE - Clear and consistent =====
  const responseData = {
    success: true,
    thread: populatedThread.toObject(),

    // ===== 🎯 MODERATION INFO =====
    moderationStatus, // "approved", "pending", "rejected"
    needsApproval: moderationStatus === "pending", // boolean for frontend logic
    isAutoApproved: autoApproved, // was it auto-approved?
    slug: populatedThread.slug, // for navigation

    // ===== 📊 ANALYSIS INFO (for debugging) =====
    autoAnalysis: {
      riskLevel: contentAnalysis.overallRisk,
      riskScore: Math.round(contentAnalysis.combinedScore),
      autoApprovalReason: autoApprovalReason,
      moderationNote: moderationNote,
    },

    // ===== 💬 USER MESSAGE =====
    message:
      moderationStatus === "pending"
        ? user.trustLevel === "trusted" || user.autoApprovalEnabled
          ? "Cảm ơn bạn đã đăng bài! Do nội dung được hệ thống phân tích là có thể có rủi ro, bài viết sẽ được quản trị viên xem qua nhanh chóng trước khi hiển thị."
          : "Bài viết của bạn đã được gửi và đang chờ kiểm duyệt. Cảm ơn sự kiên nhẫn của bạn!"
        : moderationStatus === "approved"
        ? "Bài viết đã được đăng thành công"
        : `Bài viết bị từ chối: ${
            contentAnalysis.recommendations?.reason ||
            "Nội dung vi phạm quy tắc cộng đồng"
          }`,
  };

  console.log("📤 Sending response:", {
    status: moderationStatus,
    needsApproval: responseData.needsApproval,
    slug: responseData.slug,
  });

  res.status(201).json(responseData);
});

// @desc    Tạo trả lời mới cho một chủ đề
// @route   POST /api/forum/threads/:threadId/replies
// @access  Private (Logged in users)
const createReply = asyncHandler(async (req, res) => {
  const { content, parentReply } = req.body; // ✅ Thêm parentReply để support nested replies
  const { threadId } = req.params;

  // ===== ✅ VALIDATION =====
  if (!content) {
    res.status(400);
    throw new Error("Vui lòng cung cấp nội dung trả lời");
  }

  if (content.trim().length < 5) {
    res.status(400);
    throw new Error("Nội dung phải có ít nhất 5 ký tự");
  }

  // ===== 🔍 KIỂM TRA THREAD TỒN TẠI VÀ TRẠNG THÁI =====
  const thread = await ForumThread.findOne({
    _id: threadId,
    moderationStatus: "approved", // ✅ Chỉ cho phép reply vào thread đã duyệt
    isDeleted: false,
  }).populate("author");

  if (!thread) {
    res.status(404);
    throw new Error("Chủ đề không tồn tại hoặc đang chờ kiểm duyệt");
  }

  // ===== 🔒 KIỂM TRA THREAD CÓ BỊ KHÓA KHÔNG =====
  if (thread.isLocked) {
    res.status(403);
    throw new Error("Chủ đề này đã bị khóa và không thể trả lời.");
  }

  // ===== 📋 KIỂM TRA PARENT REPLY NẾU CÓ =====
  let parentReplyData = null;
  if (parentReply) {
    parentReplyData = await ForumReply.findOne({
      _id: parentReply,
      thread: threadId,
      moderationStatus: "approved",
      isDeleted: false,
    });

    if (!parentReplyData) {
      res.status(404);
      throw new Error("Trả lời gốc không tồn tại hoặc đã bị xóa");
    }
  }

  // ===== 🤖 AUTO-MODERATION ANALYSIS FOR REPLY =====
  console.log("🤖 Running auto-moderation for REPLY content...");

  // Lấy thông tin user với forumStats
  const user = await User.findById(req.user._id);
  console.log("👤 User info for reply moderation:", {
    id: user._id,
    trustLevel: user.trustLevel,
    autoApprovalEnabled: user.autoApprovalEnabled,
    role: user.role,
    forumStats: user.forumStats,
  });

  // 🔍 ANALYZE REPLY CONTENT - Chỉ truyền content (không có title)
  const contentAnalysis = analyzeContent(content); // ✅ Chỉ 1 tham số cho reply
  console.log("📊 Reply content analysis result:", contentAnalysis);

  // ===== 🛡️ VALIDATION FOR CONTENT ANALYSIS =====
  if (!contentAnalysis || contentAnalysis.error) {
    console.warn(
      "⚠️ Content analysis failed for reply, defaulting to safe approval"
    );
    // Fallback nếu content analysis fail - reply ít rủi ro hơn nên có thể approve
    const fallbackAnalysis = {
      overallRisk: "low",
      combinedScore: 0.3,
      recommendations: {
        action: "approve",
        reason: "Content analysis failed - approved as low risk reply",
      },
    };
    contentAnalysis = fallbackAnalysis;
  }

  // ===== 🎯 SIMPLIFIED REPLY MODERATION LOGIC =====
  console.log("🎯 Starting simplified reply moderation decision...");

  let moderationStatus;
  let autoApproved = false;
  let autoApprovalReason = null;
  let moderationNote = "";

  // 🔥 STEP 1: Check for auto-rejection (critical violations)
  if (contentAnalysis.shouldReject || contentAnalysis.combinedScore > 80) {
    console.log("🚫 AUTO-REJECT: Critical reply violation");
    moderationStatus = "rejected";
    moderationNote = `Tự động từ chối: ${contentAnalysis.recommendations.reason}`;

    // Update user violation stats
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { "forumStats.reportsReceived": 1 },
    });

    res.status(400);
    throw new Error(
      `Phản hồi bị từ chối: ${contentAnalysis.recommendations.reason}`
    );
  }

  // ✅ STEP 2: Auto-approve all other cases (replies are more lenient)
  else {
    console.log("✅ AUTO-APPROVE: Reply approved");
    moderationStatus = "approved";
    autoApproved = true;

    if (user.role === "admin" || user.role === "moderator") {
      autoApprovalReason = user.role; // "admin" hoặc "moderator"
      moderationNote = `Tự động phê duyệt: Quyền ${user.role}`;
    } else if (contentAnalysis.overallRisk === "high") {
      autoApprovalReason = user.role; // "admin" hoặc "moderator"
      moderationNote = `Phê duyệt reply có rủi ro: ${
        contentAnalysis.overallRisk
      } (${Math.round(contentAnalysis.combinedScore)}/100)`;
    } else {
      autoApprovalReason = "content_safe";
      moderationNote = `Phê duyệt reply an toàn: ${
        contentAnalysis.overallRisk
      } (${Math.round(contentAnalysis.combinedScore)}/100)`;
    }
  }

  console.log("✅ Reply moderation decision made:", {
    status: moderationStatus,
    autoApproved,
    reason: autoApprovalReason,
    note: moderationNote,
  });

  // ===== 💬 TẠO REPLY MỚI =====
  console.log(
    "💾 Creating new reply with moderation status:",
    moderationStatus
  );

  const reply = new ForumReply({
    content,
    thread: threadId,
    author: req.user._id,
    parentReply: parentReply || null, // ✅ Support nested replies
    moderationStatus,
    autoApproved,
    autoApprovalReason,
    moderationNote,
  });

  const createdReply = await reply.save();

  // ===== 📊 CẬP NHẬT USER STATS =====
  await User.findByIdAndUpdate(req.user._id, {
    $inc: { "forumStats.repliesCount": 1 },
  });

  // ===== 📈 CẬP NHẬT THREAD REPLY COUNT (CHỈ NẾU APPROVED) =====
  if (moderationStatus === "approved") {
    await ForumThread.findByIdAndUpdate(threadId, {
      $inc: { replyCount: 1 },
      lastReplyTime: new Date(),
      lastReplyAuthor: req.user._id,
    });
    console.log("📈 Updated thread reply count and last reply info");
  }

  // ===== 📤 POPULATE VÀ TRẢ VỀ =====
  const populatedReply = await ForumReply.findById(createdReply._id)
    .populate("author", "displayName avatarUrl")
    .populate("parentReply", "content author isDeleted");

  // ===== 🔔 TẠO THÔNG BÁO CHO TÁC GIẢ THREAD (CHỈ NẾU APPROVED) =====
  if (moderationStatus === "approved") {
    try {
      const { createReplyNotification } = await import(
        "./notificationController.js"
      );
      await createReplyNotification(populatedReply, thread);
    } catch (error) {
      console.error("Error creating reply notification:", error);
    }
  }

  console.log("✅ Reply created successfully:", {
    id: createdReply._id,
    status: moderationStatus,
    autoApproved: autoApproved,
    parentReply: parentReply || null,
  });

  // ===== 📤 CONSISTENT RESPONSE STRUCTURE =====
  const responseData = {
    success: true,
    reply: populatedReply.toObject(),

    // ===== 🎯 MODERATION INFO =====
    moderationStatus, // "approved" or "rejected" (no pending for replies)
    needsApproval: false, // replies never need approval
    isAutoApproved: autoApproved, // was it auto-approved?

    // ===== 📊 ANALYSIS INFO =====
    autoAnalysis: {
      riskLevel: contentAnalysis.overallRisk,
      riskScore: Math.round(contentAnalysis.combinedScore),
      autoApprovalReason: autoApprovalReason,
      moderationNote: moderationNote,
    },

    // ===== 💬 USER MESSAGE =====
    message:
      moderationStatus === "rejected"
        ? "Phản hồi bị từ chối do vi phạm quy tắc cộng đồng"
        : "Phản hồi đã được đăng thành công",
  };

  console.log("📤 Sending reply response:", {
    status: moderationStatus,
    autoApproved,
    riskScore: responseData.autoAnalysis.riskScore,
  });

  res.status(201).json(responseData);
});

// 🚨 @desc    Tạo báo cáo nội dung vi phạm
// @route   POST /api/forum/reports
// @access  Private (Logged in users)
const createReport = asyncHandler(async (req, res) => {
  const { reportType, targetId, reason, description } = req.body;

  // ===== ✅ VALIDATION =====
  if (!reportType || !targetId || !reason) {
    res.status(400);
    throw new Error("Vui lòng cung cấp đầy đủ thông tin báo cáo");
  }

  if (!["thread", "reply"].includes(reportType)) {
    res.status(400);
    throw new Error("Loại báo cáo không hợp lệ");
  }

  // ===== 🔍 KIỂM TRA TARGET TỒN TẠI =====
  let target = null;
  let targetTitle = "";

  if (reportType === "thread") {
    target = await ForumThread.findById(targetId).populate(
      "author",
      "displayName"
    );
    targetTitle = target?.title || "Thread không xác định";
  } else {
    target = await ForumReply.findById(targetId).populate(
      "author",
      "displayName"
    );
    targetTitle = `Trả lời của ${target?.author?.displayName || "Ẩn danh"}`;
  }

  if (!target) {
    res.status(404);
    throw new Error("Nội dung cần báo cáo không tồn tại");
  }

  // ===== 🚫 KIỂM TRA KHÔNG TỰ BÁO CÁO CHÍNH MÌNH =====
  if (target.author._id.toString() === req.user._id.toString()) {
    res.status(400);
    throw new Error("Bạn không thể báo cáo nội dung của chính mình");
  }

  // ===== 🔄 KIỂM TRA DUPLICATE REPORT =====
  const existingReport = await ForumReport.findOne({
    reportType,
    targetId,
    reporter: req.user._id,
    status: { $in: ["pending", "reviewed"] },
  });

  if (existingReport) {
    res.status(400);
    throw new Error("Bạn đã báo cáo nội dung này rồi");
  }

  // ===== 💾 TẠO REPORT MỚI =====
  const report = await ForumReport.create({
    reportType,
    targetId,
    reporter: req.user._id,
    reason,
    description: description || "",
    priority: ["violence", "hate_speech", "harassment"].includes(reason)
      ? "high"
      : "medium",
  });

  // ===== 📊 CẬP NHẬT REPORT COUNT CỦA TARGET =====
  if (reportType === "thread") {
    await ForumThread.findByIdAndUpdate(targetId, {
      $inc: { reportCount: 1 },
    });
  } else {
    await ForumReply.findByIdAndUpdate(targetId, {
      $inc: { reportCount: 1 },
    });
  }

  // ===== 🔔 TẠO NOTIFICATION CHO ADMIN =====
  try {
    const admins = await User.find({ role: "admin" });

    const notificationPromises = admins.map((admin) =>
      Notification.create({
        recipient: admin._id,
        title: "Báo cáo nội dung vi phạm mới",
        message: `Có báo cáo mới về ${
          reportType === "thread" ? "bài viết" : "trả lời"
        }: "${targetTitle}"`,
        type: "report_received",
        priority: report.priority,
        relatedModel: "ForumReport",
        relatedId: report._id,
        metadata: {
          reportType,
          targetId,
          reason,
          reporterName: req.user.displayName || "Ẩn danh",
          targetTitle,
        },
      })
    );

    await Promise.all(notificationPromises);
    console.log(
      `✅ Created report notifications for ${admins.length} admin(s)`
    );
  } catch (error) {
    console.error("❌ Error creating report notification:", error);
  }

  const populatedReport = await ForumReport.findById(report._id).populate(
    "reporter",
    "displayName avatarUrl"
  );

  console.log("✅ Report created successfully:", {
    id: report._id,
    type: reportType,
    reason: reason,
    priority: report.priority,
  });

  res.status(201).json({
    success: true,
    report: populatedReport,
    message:
      "Báo cáo đã được gửi thành công. Chúng tôi sẽ xem xét trong thời gian sớm nhất.",
  });
});

// @desc    Lấy threads thảo luận về một phim cụ thể
// @route   GET /api/forum/threads/movie/:movieId
// @access  Public
const getThreadsByMovie = asyncHandler(async (req, res) => {
  const { movieId } = req.params;
  const currentPage = parseInt(req.query.page, 10) || 1;
  const threadsPerPage = Math.min(parseInt(req.query.limit, 10) || 15, 50);

  // ===== 🔍 VALIDATE MOVIE EXISTS =====
  const movieExists = await MovieMetadata.findById(movieId).lean();
  if (!movieExists) {
    res.status(404);
    throw new Error("Phim không tồn tại trong hệ thống");
  }

  // ===== 🎬 QUERY THREADS BY MOVIE =====
  const pipeline = [
    // Stage 1: Match threads for this movie (updated for array)
    {
      $match: {
        "movieMetadata.movieId": movieId,
        moderationStatus: "approved",
        isDeleted: false,
      },
    },

    // Stage 2: Lookup author information
    {
      $lookup: {
        from: "users",
        localField: "author",
        foreignField: "_id",
        as: "author",
        pipeline: [{ $project: { displayName: 1, avatarUrl: 1 } }],
      },
    },

    // Stage 3: Lookup category information
    {
      $lookup: {
        from: "forumcategories",
        localField: "category",
        foreignField: "_id",
        as: "category",
        pipeline: [{ $project: { name: 1, slug: 1 } }],
      },
    },

    // Stage 4: Clean up arrays
    {
      $addFields: {
        author: { $arrayElemAt: ["$author", 0] },
        category: { $arrayElemAt: ["$category", 0] },
      },
    },

    // Stage 5: Sort by creation date (newest first)
    {
      $sort: { createdAt: -1 },
    },

    // Stage 6: Pagination
    {
      $facet: {
        totalCount: [{ $count: "count" }],
        paginatedResults: [
          { $skip: (currentPage - 1) * threadsPerPage },
          { $limit: threadsPerPage },
        ],
      },
    },
  ];

  const [result] = await ForumThread.aggregate(pipeline);

  const totalThreads = result.totalCount[0]?.count || 0;
  const threads = result.paginatedResults || [];
  const totalPages = Math.ceil(totalThreads / threadsPerPage);

  res.status(200).json({
    success: true,
    movie: {
      _id: movieExists._id,
      name: movieExists.name,
      slug: movieExists.slug,
      posterUrl: movieExists.posterUrl,
      year: movieExists.year,
      type: movieExists.type,
    },
    threads: threads,
    pagination: {
      currentPage,
      totalPages,
      totalItems: totalThreads,
      limit: threadsPerPage,
    },
  });
});

// @desc    Lấy movie discussions trending (threads phim hot)
// @route   GET /api/forum/movie-discussions/trending
// @access  Public
const getTrendingMovieDiscussions = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 10, 20);
  const timeframe = req.query.timeframe || "week"; // week, month, all

  let dateFilter = {};
  if (timeframe === "week") {
    dateFilter = {
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    };
  } else if (timeframe === "month") {
    dateFilter = {
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    };
  }

  const pipeline = [
    // Stage 1: Match movie discussion threads (updated for new schema)
    {
      $match: {
        isMovieDiscussion: true,
        "movieMetadata.0": { $exists: true }, // At least one movie
        moderationStatus: "approved",
        isDeleted: false,
        ...dateFilter,
      },
    },

    // Stage 2: Unwind movieMetadata array to work with individual movies
    {
      $unwind: "$movieMetadata",
    },

    // Stage 3: Group by primary movie and aggregate stats
    {
      $match: {
        "movieMetadata.isPrimary": true, // Only count primary movies
      },
    },

    // Stage 4: Group by movie and aggregate stats
    {
      $group: {
        _id: "$movieMetadata.movieId",
        threadCount: { $sum: 1 },
        totalViews: { $sum: "$views" },
        totalReplies: { $sum: "$replyCount" },
        totalLikes: { $sum: "$likeCount" },
        latestThread: { $max: "$createdAt" },
        movieInfo: { $first: "$movieMetadata" }, // Get movie info from first thread
      },
    },

    // Stage 5: Calculate trending score
    {
      $addFields: {
        trendingScore: {
          $add: [
            { $multiply: ["$threadCount", 10] }, // 10 points per thread
            { $multiply: ["$totalReplies", 2] }, // 2 points per reply
            { $multiply: ["$totalLikes", 5] }, // 5 points per like
            { $divide: ["$totalViews", 10] }, // 0.1 points per view
          ],
        },
      },
    },

    // Stage 6: Sort by trending score
    {
      $sort: { trendingScore: -1, latestThread: -1 },
    },

    // Stage 7: Limit results
    {
      $limit: limit,
    },

    // Stage 8: Project final output
    {
      $project: {
        movieId: "$_id",
        movieInfo: 1,
        stats: {
          threadCount: "$threadCount",
          totalViews: "$totalViews",
          totalReplies: "$totalReplies",
          totalLikes: "$totalLikes",
          trendingScore: "$trendingScore",
        },
        latestThread: 1,
      },
    },
  ];

  const trendingMovies = await ForumThread.aggregate(pipeline);

  res.status(200).json({
    success: true,
    data: trendingMovies,
    timeframe,
    count: trendingMovies.length,
  });
});

// @desc    Search movies từ API thứ 3 với tối ưu cache
const searchMoviesForThread = asyncHandler(async (req, res) => {
  const { q: keyword } = req.query;

  if (!keyword || keyword.trim().length < 2) {
    res.status(400);
    throw new Error("Từ khóa tìm kiếm phải có ít nhất 2 ký tự");
  }

  try {
    // ✅ SIMPLE: Business logic only, middleware handles cache

    // 🔍 STEP 2: SEARCH FROM THIRD-PARTY API
    const PHIM_API_DOMAIN = "https://phimapi.com";
    console.log(`🔍 Searching movies with keyword: "${keyword.trim()}"`);

    const searchResponse = await axios.get(
      `${PHIM_API_DOMAIN}/v1/api/tim-kiem?keyword=${encodeURIComponent(
        keyword.trim()
      )}`
    );

    if (
      !searchResponse.data ||
      !searchResponse.data.data ||
      !searchResponse.data.data.items
    ) {
      console.log("⚠️ No movies found or invalid API response structure");
      return res.status(200).json({
        success: true,
        movies: [],
        message: "Không tìm thấy phim nào",
      });
    }

    const searchResults = searchResponse.data.data.items;
    console.log(`✅ Found ${searchResults.length} movies from API`);

    // 🚀 STEP 3: QUICK RESPONSE - Return immediately with basic data
    const quickResults = searchResults.slice(0, 10).map((movie) => ({
      _id: movie._id,
      slug: movie.slug,
      name: movie.name,
      originName: movie.origin_name,
      posterUrl: getOptimizedPosterUrl(movie.poster_url || movie.thumb_url),
      thumbUrl: getOptimizedPosterUrl(movie.thumb_url),
      year: movie.year,
      type: movie.type,
      category: movie.category,
      displayName: `${movie.name} ${movie.year ? `(${movie.year})` : ""}`,
      typeDisplay: getMovieTypeDisplay(movie.type),
      _fromCache: false,
    }));

    const responseData = {
      success: true,
      movies: quickResults,
      total: searchResults.length,
      keyword: keyword.trim(),
      _processingMetadata: true,
    };

    // 📤 RESPONSE for better UX
    res.status(200).json(responseData);

    // 🔄 BACKGROUND PROCESSING - Không block response
    // Chỉ update access time cho movies đã có metadata
    setImmediate(async () => {
      try {
        console.log(
          "🔄 Background updating access time for existing metadata..."
        );

        await Promise.allSettled(
          searchResults.slice(0, 10).map(async (movie) => {
            try {
              const existingMetadata = await MovieMetadata.findById(movie._id);
              if (existingMetadata) {
                existingMetadata.lastAccessedByApp = new Date();
                await existingMetadata.save();
                console.log(`📈 Updated access time for: ${movie.name}`);
              }
              // ✅ KHÔNG tạo metadata mới ở đây - chỉ khi user chọn
            } catch (error) {
              console.error(
                `❌ Background update error for ${movie._id}:`,
                error
              );
            }
          })
        );

        console.log("✅ Background access time update completed");
      } catch (error) {
        console.error("❌ Background processing failed:", error);
      }
    });
  } catch (error) {
    console.error("❌ Error searching movies:", error);

    if (error.response?.status === 404) {
      return res.status(200).json({
        success: true,
        movies: [],
        message: "Không tìm thấy phim nào với từ khóa này",
      });
    }

    res.status(500);
    throw new Error("Lỗi khi tìm kiếm phim. Vui lòng thử lại sau.");
  }
});

// ===== 🛡️ HELPER: Validate moderation data consistency =====
const validateModerationConsistency = (
  moderationStatus,
  isApproved,
  autoApproved
) => {
  const errors = [];

  // Rule 1: isApproved must match moderationStatus
  if (moderationStatus === "approved" && !isApproved) {
    errors.push("isApproved should be true when moderationStatus is approved");
  }

  if (moderationStatus !== "approved" && isApproved) {
    errors.push(
      "isApproved should be false when moderationStatus is not approved"
    );
  }

  // Rule 2: autoApproved can only be true if moderationStatus is approved
  if (autoApproved && moderationStatus !== "approved") {
    errors.push(
      "autoApproved can only be true when moderationStatus is approved"
    );
  }

  // Rule 3: moderationStatus must be valid
  const validStatuses = ["approved", "pending", "rejected"];
  if (!validStatuses.includes(moderationStatus)) {
    errors.push(`moderationStatus must be one of: ${validStatuses.join(", ")}`);
  }

  if (errors.length > 0) {
    console.error("🚨 Moderation consistency errors:", errors);
    return { isValid: false, errors };
  }

  return { isValid: true, errors: [] };
};

// @desc    Soft delete a thread
// @route   DELETE /api/forum/threads/:threadId
// @access  Private (Author or Admin)
const deleteThread = asyncHandler(async (req, res) => {
  const { threadId } = req.params;

  const thread = await ForumThread.findById(threadId);

  if (!thread) {
    res.status(404);
    throw new Error("Chủ đề không tồn tại");
  }

  // 🛡️ PERMISSION CHECK: Only author or admin can delete
  const isAdmin = req.user.role === "admin";
  const isAuthor = req.user._id.toString() === thread.author.toString();

  if (!isAdmin && !isAuthor) {
    res.status(403);
    throw new Error("Bạn không có quyền xóa chủ đề này");
  }

  if (thread.isDeleted) {
    res.status(400);
    throw new Error("Chủ đề này đã được xóa trước đó");
  }

  // Perform soft delete
  thread.isDeleted = true;
  thread.moderationStatus = "rejected"; // To be sure
  await thread.save();

  // Decrement thread count in the category
  await ForumCategory.findByIdAndUpdate(thread.category, {
    $inc: { threadCount: -1 },
  });

  // 🔔 NOTIFICATION: Inform the user if an admin deleted their thread
  if (isAdmin && !isAuthor) {
    await Notification.createNotification({
      recipient: thread.author,
      sender: req.user._id,
      type: "content_removed",
      title: "Một chủ đề của bạn đã bị xóa",
      message: `Chủ đề của bạn "${thread.title}" đã bị quản trị viên xóa.`,
      relatedData: {
        threadId: thread._id,
        categoryId: thread.category,
      },
    });
  }

  res.status(200).json({ success: true, message: "Chủ đề đã được xóa" });
});

// @desc    Soft delete a reply
// @route   DELETE /api/forum/replies/:replyId
// @access  Private (Author or Admin)
const deleteReply = asyncHandler(async (req, res) => {
  const { replyId } = req.params;

  const reply = await ForumReply.findById(replyId);

  if (!reply) {
    res.status(404);
    throw new Error("Trả lời không tồn tại");
  }

  // 🛡️ PERMISSION CHECK: Only author or admin can delete
  const isAdmin = req.user.role === "admin";
  const isAuthor = req.user._id.toString() === reply.author.toString();

  if (!isAdmin && !isAuthor) {
    res.status(403);
    throw new Error("Bạn không có quyền xóa trả lời này");
  }

  if (reply.isDeleted) {
    res.status(400);
    throw new Error("Trả lời này đã được xóa trước đó");
  }

  // Perform soft delete
  reply.isDeleted = true;
  reply.moderationStatus = "rejected";
  await reply.save();

  // Decrement reply count in the thread
  const updatedThread = await ForumThread.findByIdAndUpdate(
    reply.thread,
    { $inc: { replyCount: -1 } },
    { new: true }
  );

  // 🔔 NOTIFICATION: Inform the user if an admin deleted their reply
  if (isAdmin && !isAuthor) {
    await Notification.createNotification({
      recipient: reply.author,
      sender: req.user._id,
      type: "content_removed",
      title: "Một trả lời của bạn đã bị xóa",
      message: `Trả lời của bạn trong chủ đề "${
        updatedThread?.title || "không xác định"
      }" đã bị quản trị viên xóa.`,
      actionUrl: `/forum/thread/${updatedThread?.slug}`,
      relatedData: {
        threadId: reply.thread,
        replyId: reply._id,
      },
    });
  }

  res.status(200).json({ success: true, message: "Trả lời đã được xóa" });
});

// ===== 📊 SYSTEM HEALTH CHECK =====
const getForumSystemHealth = asyncHandler(async (req, res) => {
  try {
    console.log("🔍 Running forum system health check...");

    // Check moderation consistency
    const inconsistentThreads = await ForumThread.find({
      $or: [
        { moderationStatus: "approved", isApproved: false },
        { moderationStatus: { $ne: "approved" }, isApproved: true },
        { autoApproved: true, moderationStatus: { $ne: "approved" } },
      ],
    })
      .select("_id title moderationStatus isApproved autoApproved")
      .limit(10);

    // Check orphaned replies
    const orphanedReplies = await ForumReply.countDocuments({
      thread: { $exists: false },
    });

    // Check inactive categories with threads
    const inactiveCategoriesWithThreads = await ForumCategory.find({
      isActive: false,
      threadCount: { $gt: 0 },
    }).select("name threadCount");

    // Check threads without categories
    const threadsWithoutCategory = await ForumThread.countDocuments({
      category: { $exists: false },
    });

    // Performance metrics
    const totalThreads = await ForumThread.countDocuments();
    const pendingThreads = await ForumThread.countDocuments({
      moderationStatus: "pending",
    });
    const approvedThreads = await ForumThread.countDocuments({
      moderationStatus: "approved",
    });
    const rejectedThreads = await ForumThread.countDocuments({
      moderationStatus: "rejected",
    });

    const healthReport = {
      timestamp: new Date(),
      status: inconsistentThreads.length === 0 ? "healthy" : "warning",

      // Consistency checks
      consistency: {
        inconsistentThreads: inconsistentThreads.length,
        inconsistentData: inconsistentThreads,
        orphanedReplies,
        inactiveCategoriesWithThreads: inactiveCategoriesWithThreads.length,
        threadsWithoutCategory,
      },

      // Performance metrics
      metrics: {
        totalThreads,
        pendingThreads,
        approvedThreads,
        rejectedThreads,
        approvalRate:
          totalThreads > 0
            ? ((approvedThreads / totalThreads) * 100).toFixed(2) + "%"
            : "0%",
      },

      // Recommendations
      recommendations: [],
    };

    // Generate recommendations
    if (inconsistentThreads.length > 0) {
      healthReport.recommendations.push(
        "Fix moderation status inconsistencies"
      );
    }

    if (orphanedReplies > 0) {
      healthReport.recommendations.push(
        `Clean up ${orphanedReplies} orphaned replies`
      );
    }

    if (pendingThreads > 50) {
      healthReport.recommendations.push(
        "High number of pending threads - consider reviewing moderation queue"
      );
    }

    console.log("📊 Health check completed:", {
      status: healthReport.status,
      issues: healthReport.recommendations.length,
    });

    res.json({
      success: true,
      data: healthReport,
    });
  } catch (error) {
    console.error("❌ Health check failed:", error);
    res.status(500).json({
      success: false,
      message: "Health check failed",
      error: error.message,
    });
  }
});

export {
  getForumCategories,
  createCategory,
  getForumThreadsWithPagination,
  getThreadBySlug,
  createThread,
  createReply,
  createReport,
  getThreadsByMovie,
  getTrendingMovieDiscussions,
  searchMoviesForThread,
  getForumSystemHealth,
  deleteThread,
  deleteReply,
};
