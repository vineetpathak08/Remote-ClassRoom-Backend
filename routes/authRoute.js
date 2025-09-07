import express from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
import { isAuthenticated } from "../middleware/isAuthenticated.js";

const router = express.Router();

//Step-1: Redirect to Google login
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",

  passport.authenticate("google", { session: false }),
  (req, res) => {
    try {
      const token = jwt.sign(
        { id: req.user._id, email: req.user.email },
        process.env.SECRET_KEY,
        { expiresIn: "7d" }
      );

      // Get the origin from the referrer or use default CLIENT_URL
      const referrer = req.get("Referrer") || req.get("Origin");
      let redirectUrl = process.env.CLIENT_URL;

      // If referrer is from a Vercel frontend deployment, use that
      if (
        referrer &&
        referrer.includes("remote-class-room-frontend") &&
        referrer.includes(".vercel.app")
      ) {
        const url = new URL(referrer);
        redirectUrl = `${url.protocol}//${url.host}`;
      }

      res.redirect(`${redirectUrl}/auth-success?token=${token}`);
    } catch (error) {
      console.error("Google login error:", error);

      // Same logic for error redirect
      const referrer = req.get("Referrer") || req.get("Origin");
      let redirectUrl = process.env.CLIENT_URL;
      if (
        referrer &&
        referrer.includes("remote-class-room-frontend") &&
        referrer.includes(".vercel.app")
      ) {
        const url = new URL(referrer);
        redirectUrl = `${url.protocol}//${url.host}`;
      }

      res.redirect(`${redirectUrl}/login?error=google_failed`);
    }
  }
);

router.get("/me", isAuthenticated, (req, res) => {
  res.json({ success: true, user: req.user });
});

export default router;
