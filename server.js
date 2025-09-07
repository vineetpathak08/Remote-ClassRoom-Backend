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
    origin: process.env.CLIENT_URL || "http://localhost:5173",
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
