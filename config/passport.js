import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { User } from "../models/userModel.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, cb) => {
      console.log(profile);

      try {
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          // Create new user with Google profile data
          user = await User.create({
            googleId: profile.id,
            username: profile.displayName,
            email: profile.emails[0].value,
            avatar: profile.photos[0].value,
            isLoggedIn: true,
            isVerified: true,
          });
        } else {
          // Update existing user with latest profile data and login status
          user = await User.findOneAndUpdate(
            { googleId: profile.id },
            {
              isLoggedIn: true,
              avatar: profile.photos[0].value, // Update avatar in case it changed
              username: profile.displayName, // Update username in case it changed
            },
            { new: true } // Return updated document
          );
        }

        return cb(null, user);
      } catch (error) {
        return cb(error, null);
      }
    }
  )
);
