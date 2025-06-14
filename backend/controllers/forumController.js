import asyncHandler from "express-async-handler"; // Giả sử bạn dùng express-async-handler
import ForumCategory from "../models/ForumCategory.js";
import ForumThread from "../models/ForumThread.js";
import ForumReply from "../models/ForumReply.js";

// @desc    Lấy tất cả danh mục forum
// @route   GET /api/forum/categories
// @access  Public
const getCategories = asyncHandler(async (req, res) => {
  // Sắp xếp theo tên hoặc thời gian tạo tùy ý
  const categories = await ForumCategory.find().sort({ name: 1 });
  res.status(200).json(categories);
});

// @desc    Tạo danh mục mới (Admin)
// @route   POST /api/forum/categories
// @access  Private/Admin
const createCategory = asyncHandler(async (req, res) => {
  // TODO: Implement logic + Add admin check middleware
  res.status(501).json({ message: "Chức năng chưa được triển khai" });
});

// @desc    Lấy danh sách chủ đề diễn đàn với phân trang và lọc
// @route   GET /api/forum/threads?category=slug&page=1&limit=10&sort=field
// @access  Public
// @logic   PHÂN TRANG + LỌC THEO CATEGORY + SẮP XẾP
const getForumThreadsWithPagination = asyncHandler(async (req, res) => {
  // ===== EXTRACT QUERY PARAMETERS =====
  const currentPage = parseInt(req.query.page, 10) || 1;
  const threadsPerPage = parseInt(req.query.limit, 10) || 15; // Default: 15 threads/page
  const filterByCategorySlug = req.query.category; // Optional category filter
  const sortingCriteria = req.query.sort || "-lastReplyTime -createdAt"; // Default: latest reply first

  // ===== CALCULATE PAGINATION INDICES =====
  const skipThreadsCount = (currentPage - 1) * threadsPerPage;
  const endIndex = currentPage * threadsPerPage;

  // ===== BUILD DATABASE QUERY =====
  let databaseQuery = {};
  let selectedCategoryInfo = null;

  // Nếu có lọc theo category slug - FILTER BY CATEGORY
  if (filterByCategorySlug) {
    selectedCategoryInfo = await ForumCategory.findOne({
      slug: filterByCategorySlug,
    });
    if (!selectedCategoryInfo) {
      res.status(404);
      throw new Error("Danh mục diễn đàn không tồn tại");
    }
    databaseQuery.category = selectedCategoryInfo._id;
  }

  // ===== EXECUTE DATABASE QUERIES =====
  const totalThreadsCount = await ForumThread.countDocuments(databaseQuery);
  const totalPagesCount = Math.ceil(totalThreadsCount / threadsPerPage);

  const forumThreadsList = await ForumThread.find(databaseQuery)
    .populate("author", "displayName avatarUrl") // Lấy thông tin người tạo thread
    .populate("category", "name slug") // Lấy thông tin category
    .populate("lastReplyAuthor", "displayName avatarUrl") // Lấy thông tin người reply cuối
    .sort(sortingCriteria) // Sắp xếp theo criteria
    .skip(skipThreadsCount) // Bỏ qua threads của trang trước
    .limit(threadsPerPage); // Giới hạn threads của trang hiện tại

  // ===== BUILD RESPONSE DATA =====
  res.status(200).json({
    success: true,
    count: forumThreadsList.length,
    pagination: {
      currentPage: currentPage,
      totalPages: totalPagesCount,
      totalItems: totalThreadsCount,
      limit: threadsPerPage,
      // Thông tin navigation
      ...(endIndex < totalThreadsCount && { nextPage: currentPage + 1 }),
      ...(skipThreadsCount > 0 && { prevPage: currentPage - 1 }),
    },
    // Trả về thông tin category nếu đang filter
    category: selectedCategoryInfo
      ? {
          name: selectedCategoryInfo.name,
          slug: selectedCategoryInfo.slug,
          description: selectedCategoryInfo.description,
        }
      : null,
    threads: forumThreadsList,
  });
});

// @desc    Lấy chi tiết một chủ đề bằng slug (bao gồm replies phân trang)
// @route   GET /api/forum/threads/:slug?replyPage=1&replyLimit=10
// @access  Public
const getThreadBySlug = asyncHandler(async (req, res) => {
  const slug = req.params.slug;
  const replyPage = parseInt(req.query.replyPage, 10) || 1;
  const replyLimit = parseInt(req.query.replyLimit, 10) || 10; // Số replies mỗi trang

  const replyStartIndex = (replyPage - 1) * replyLimit;

  // Tìm thread bằng slug, populate thông tin author và category
  // Đồng thời tăng view count
  const thread = await ForumThread.findOneAndUpdate(
    { slug: slug },
    { $inc: { views: 1 } }, // Tăng view count
    { new: true } // Trả về document đã cập nhật
  )
    .populate("author", "displayName avatarUrl")
    .populate("category", "name slug description");

  if (!thread) {
    res.status(404);
    throw new Error("Chủ đề không tồn tại");
  }

  // Lấy tổng số replies cho thread này
  const totalReplies = await ForumReply.countDocuments({ thread: thread._id });
  const totalReplyPages = Math.ceil(totalReplies / replyLimit);

  // Lấy replies cho trang hiện tại, populate author, sắp xếp theo thời gian tạo
  const replies = await ForumReply.find({ thread: thread._id })
    .populate("author", "displayName avatarUrl")
    .sort({ createdAt: 1 }) // Sắp xếp trả lời từ cũ đến mới
    .skip(replyStartIndex)
    .limit(replyLimit);

  res.status(200).json({
    success: true,
    thread,
    replies: {
      items: replies,
      pagination: {
        currentPage: replyPage,
        totalPages: totalReplyPages,
        totalItems: totalReplies,
        limit: replyLimit,
        ...(replyStartIndex + replies.length < totalReplies && {
          nextPage: replyPage + 1,
        }),
        ...(replyStartIndex > 0 && { prevPage: replyPage - 1 }),
      },
    },
  });
});

// @desc    Tạo chủ đề mới
// @route   POST /api/forum/threads
// @access  Private (Logged in users)
const createThread = asyncHandler(async (req, res) => {
  const { title, content, categoryId } = req.body;

  // --- Validation cơ bản ---
  if (!title || !content || !categoryId) {
    res.status(400);
    throw new Error("Vui lòng cung cấp đầy đủ tiêu đề, nội dung và danh mục");
  }

  // Kiểm tra xem categoryId có hợp lệ không
  const categoryExists = await ForumCategory.findById(categoryId);
  if (!categoryExists) {
    res.status(404);
    throw new Error("Danh mục được chọn không tồn tại");
  }

  // Tạo thread mới
  const thread = new ForumThread({
    title,
    content,
    category: categoryId,
    author: req.user._id, // Lấy ID từ user đã được xác thực bởi middleware 'protect'
    lastReplyTime: Date.now(), // Khởi tạo lastReplyTime bằng thời gian tạo thread
  });

  const createdThread = await thread.save();

  // Cập nhật threadCount trong Category
  await ForumCategory.findByIdAndUpdate(categoryId, {
    $inc: { threadCount: 1 },
  });

  // Populate thông tin author và category để trả về cho client
  const populatedThread = await ForumThread.findById(createdThread._id)
    .populate("author", "displayName avatarUrl")
    .populate("category", "name slug");

  res.status(201).json(populatedThread);
});

// @desc    Tạo trả lời mới cho một chủ đề
// @route   POST /api/forum/threads/:threadId/replies
// @access  Private (Logged in users)
const createReply = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const { threadId } = req.params;

  if (!content) {
    res.status(400);
    throw new Error("Vui lòng cung cấp nội dung trả lời");
  }

  const thread = await ForumThread.findById(threadId);

  if (!thread) {
    res.status(404);
    throw new Error("Chủ đề không tồn tại");
  }

  // Không cho phép trả lời vào chủ đề đã khóa
  if (thread.isLocked) {
    res.status(403);
    throw new Error("Chủ đề này đã bị khóa và không thể trả lời.");
  }

  const reply = new ForumReply({
    content,
    thread: threadId,
    author: req.user._id, // req.user được cung cấp bởi middleware 'protect'
  });

  const createdReply = await reply.save();

  // Populate author information for the created reply
  // Mongoose middleware trong ForumReply model sẽ tự động cập nhật ForumThread
  const populatedReply = await ForumReply.findById(createdReply._id).populate(
    "author",
    "displayName avatarUrl"
  );

  res.status(201).json(populatedReply);
});

export {
  getCategories,
  createCategory,
  getForumThreadsWithPagination, // ✅ Updated name
  getThreadBySlug,
  createThread,
  createReply,
};
