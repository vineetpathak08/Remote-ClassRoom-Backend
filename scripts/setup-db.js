import mongoose from "mongoose";
import User from "../src/models/User.model.js";
import { logger } from "../src/utils/logger.js";
import dotenv from "dotenv";

dotenv.config();

const setupDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info("Connected to MongoDB");

    // Create indexes
    await User.createIndexes();
    logger.info("User indexes created");

    // Create default admin user
    const adminExists = await User.findOne({ email: "admin@virtualclass.com" });

    if (!adminExists) {
      const admin = new User({
        name: "System Administrator",
        email: "admin@virtualclass.com",
        password: "admin123",
        role: "admin",
      });

      await admin.save();
      logger.info("Default admin user created");
      logger.info("Email: admin@virtualclass.com");
      logger.info("Password: admin123");
    }

    // Create sample instructor
    const instructorExists = await User.findOne({
      email: "instructor@virtualclass.com",
    });

    if (!instructorExists) {
      const instructor = new User({
        name: "John Instructor",
        email: "instructor@virtualclass.com",
        password: "instructor123",
        role: "instructor",
        subject: "Computer Science",
      });

      await instructor.save();
      logger.info("Sample instructor created");
      logger.info("Email: instructor@virtualclass.com");
      logger.info("Password: instructor123");
    }

    // Create sample student
    const studentExists = await User.findOne({
      email: "student@virtualclass.com",
    });

    if (!studentExists) {
      const student = new User({
        name: "Jane Student",
        email: "student@virtualclass.com",
        password: "student123",
        role: "student",
      });

      await student.save();
      logger.info("Sample student created");
      logger.info("Email: student@virtualclass.com");
      logger.info("Password: student123");
    }

    logger.info("Database setup completed successfully");
    process.exit(0);
  } catch (error) {
    logger.error("Database setup failed:", error);
    process.exit(1);
  }
};

setupDatabase();
