import mongoose from "mongoose";

const likeSchema = new mongoose.Schema(
  {
    // Người like
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Loại content được like
    targetType: {
      type: String,
      enum: ["thread", "reply"],
      required: true,
      index: true,
    },

    // ID của thread hoặc reply được like
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    // Metadata để dễ query
    thread: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ForumThread",
      default: null,
    },

    reply: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ForumReply",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for performance
likeSchema.index({ user: 1, targetType: 1, targetId: 1 }, { unique: true });
likeSchema.index({ targetType: 1, targetId: 1 });
likeSchema.index({ user: 1, createdAt: -1 });

// Static method để toggle like
likeSchema.statics.toggleLike = async function (userId, targetType, targetId) {
  try {
    // Kiểm tra đã like chưa
    const existingLike = await this.findOne({
      user: userId,
      targetType,
      targetId,
    });

    if (existingLike) {
      // Đã like -> unlike
      await this.deleteOne({ _id: existingLike._id });
      return { action: "unliked", liked: false };
    } else {
      // Chưa like -> like
      const likeData = {
        user: userId,
        targetType,
        targetId,
      };

      // Set reference field dựa trên targetType
      if (targetType === "thread") {
        likeData.thread = targetId;
      } else if (targetType === "reply") {
        likeData.reply = targetId;
      }

      await this.create(likeData);
      return { action: "liked", liked: true };
    }
  } catch (error) {
    throw new Error(`Error toggling like: ${error.message}`);
  }
};

// Static method để đếm likes
likeSchema.statics.countLikes = async function (targetType, targetId) {
  return await this.countDocuments({ targetType, targetId });
};

// Static method để kiểm tra user đã like chưa
likeSchema.statics.isLikedByUser = async function (
  userId,
  targetType,
  targetId
) {
  const like = await this.findOne({
    user: userId,
    targetType,
    targetId,
  });
  return !!like;
};

// Static method để lấy danh sách likes của user
likeSchema.statics.getUserLikes = async function (
  userId,
  targetType = null,
  limit = 50
) {
  const filter = { user: userId };
  if (targetType) {
    filter.targetType = targetType;
  }

  return await this.find(filter)
    .populate("thread", "title slug")
    .populate("reply", "content")
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method để lấy thống kê likes
likeSchema.statics.getLikeStats = async function (targetType, targetIds) {
  const pipeline = [
    {
      $match: {
        targetType,
        targetId: { $in: targetIds },
      },
    },
    {
      $group: {
        _id: "$targetId",
        likeCount: { $sum: 1 },
      },
    },
  ];

  const results = await this.aggregate(pipeline);

  // Convert to object for easy lookup
  const stats = {};
  results.forEach((result) => {
    stats[result._id.toString()] = result.likeCount;
  });

  return stats;
};

const Like = mongoose.model("Like", likeSchema);

export default Like;
