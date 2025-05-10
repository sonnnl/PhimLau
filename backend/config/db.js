import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config(); // Đảm bảo biến môi trường được load

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error(
        "MONGODB_URI is not defined in .env file. Please add it."
      );
    }
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1); // Thoát tiến trình với lỗi nếu không kết nối được DB
  }
};

export default connectDB;
