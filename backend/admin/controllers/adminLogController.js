import asyncHandler from "express-async-handler";
import ForumAdminLog from "../../models/ForumAdminLog.js";
import mongoose from "mongoose";

// @desc    Get all admin logs with pagination and filters
// @route   GET /api/admin/logs
// @access  Private/Admin
const getAllLogs = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const { adminId, action, search } = req.query;

  const skip = (page - 1) * limit;

  // Build query
  const query = {};
  if (adminId && mongoose.Types.ObjectId.isValid(adminId)) {
    query.admin = adminId;
  }
  if (action) {
    query.action = action;
  }
  if (search) {
    query.reason = { $regex: search, $options: "i" };
  }

  const logs = await ForumAdminLog.find(query)
    .populate("admin", "username")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const totalLogs = await ForumAdminLog.countDocuments(query);

  res.status(200).json({
    message: "Admin logs fetched successfully",
    totalLogs,
    totalPages: Math.ceil(totalLogs / limit),
    currentPage: page,
    logs,
  });
});

// @desc    Get a list of all admin users who have logs
// @route   GET /api/admin/logs/admins
// @access  Private/Admin
const getAdminUsersWithLogs = asyncHandler(async (req, res) => {
  const adminIds = await ForumAdminLog.distinct("admin");
  const User = mongoose.model("User");
  const admins = await User.find({ _id: { $in: adminIds } }).select("username");
  res.status(200).json(admins);
});

// @desc    Get all possible log action types
// @route   GET /api/admin/logs/actions
// @access  Private/Admin
const getLogActionTypes = asyncHandler(async (req, res) => {
  const actions = ForumAdminLog.schema.path("action").enumValues;
  res.status(200).json(actions);
});

export { getAllLogs, getAdminUsersWithLogs, getLogActionTypes };
