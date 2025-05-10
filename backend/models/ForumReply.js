import mongoose from "mongoose";

const ForumReplySchema = new mongoose.Schema(
  {
    thread: {
      type: mongoose.Schema.ObjectId,
      ref: "ForumThread",
      required: true,
      index: true, // Index để tăng tốc độ lấy replies cho một thread
    },
    content: {
      type: String,
      required: [true, "Vui lòng nhập nội dung trả lời"],
    },
    author: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    // parentReply: { // Tạm thời bỏ qua để đơn giản
    //   type: mongoose.Schema.ObjectId,
    //   ref: 'ForumReply',
    // },
  },
  { timestamps: true }
);

// TODO: Middleware hoặc logic trong controller để cập nhật Thread khi Reply được tạo/xóa
// Ví dụ: Tăng/giảm replyCount, cập nhật lastReplyTime, lastReplyAuthor trong Thread
// Đồng thời cũng có thể cần cập nhật threadCount trong Category nếu cần (ít cần thiết hơn)

ForumReplySchema.post("save", async function () {
  // Cập nhật thông tin Thread sau khi Reply được lưu
  try {
    await this.model("ForumThread").findByIdAndUpdate(this.thread, {
      $inc: { replyCount: 1 },
      lastReplyTime: this.createdAt,
      lastReplyAuthor: this.author,
    });
    // Cập nhật threadCount trong Category (nếu cần)
    // const thread = await this.model('ForumThread').findById(this.thread).select('category');
    // await this.model('ForumCategory').findByIdAndUpdate(thread.category, { $inc: { threadCount: 1 } }); // Lưu ý: logic này chỉ đúng khi reply đầu tiên được tạo?
  } catch (err) {
    console.error(
      "Error updating thread/category counts after reply save:",
      err
    );
  }
});

ForumReplySchema.post("remove", async function () {
  // Cập nhật thông tin Thread sau khi Reply bị xóa (cần tìm reply cuối cùng mới nếu reply này là cuối)
  try {
    const threadId = this.thread;
    const latestReply = await this.model("ForumReply")
      .findOne({ thread: threadId })
      .sort({ createdAt: -1 });

    await this.model("ForumThread").findByIdAndUpdate(threadId, {
      $inc: { replyCount: -1 },
      lastReplyTime: latestReply ? latestReply.createdAt : undefined, // Nếu không còn reply nào thì xóa
      lastReplyAuthor: latestReply ? latestReply.author : undefined,
    });
  } catch (err) {
    console.error("Error updating thread counts after reply remove:", err);
  }
});

export default mongoose.model("ForumReply", ForumReplySchema);
