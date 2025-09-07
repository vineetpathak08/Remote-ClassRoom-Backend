import express from "express";
import "dotenv/config";
import connectDB from "./database/db.js";
import userRoute from "./routes/userRoute.js";
import authRoute from "./routes/authRoute.js";
import cors from "cors";
import "./config/passport.js";

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      // Allow localhost for development
      if (origin.includes("localhost")) return callback(null, true);
      
      // Allow all Vercel deployments for your frontend
      if (origin.endsWith(".vercel.app") && origin.includes("remote-class-room-frontend")) {
        return callback(null, true);
      }
      
      // Allow specific production URL if set in env
      if (origin === process.env.CLIENT_URL) {
        return callback(null, true);
      }
      
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use("/auth", authRoute);
app.use("/user", userRoute);

// http://localhost:8000/user/register

// Vercel: export the app, and connect DB on cold start
connectDB();
export default app;

// For local dev only: start server if not running on Vercel
if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server is listening at port ${PORT}`);
  });
}
