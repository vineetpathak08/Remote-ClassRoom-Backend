import mongoose from "mongoose";
import { logger } from "../utils/logger.js";

const connectDB = async () => {
  try {
    // MongoDB connection options
    const options = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
    };

    const conn = await mongoose.connect(process.env.MONGODB_URI, options);

    logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Handle connection events
    mongoose.connection.on("error", (err) => {
      logger.error("MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      logger.warn("MongoDB disconnected");
    });

    mongoose.connection.on("reconnected", () => {
      logger.info("MongoDB reconnected");
    });

    return conn;
  } catch (error) {
    logger.error(`❌ MongoDB Connection Error: ${error.message}`);

    // Try to connect to a fallback MongoDB instance or use in-memory database for development
    if (process.env.NODE_ENV === "development") {
      logger.warn("Attempting to use MongoDB Memory Server for development...");
      // You can implement MongoDB Memory Server here if needed
    }

    process.exit(1);
  }
};

export default connectDB;
