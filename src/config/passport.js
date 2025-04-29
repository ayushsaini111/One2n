import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { User } from "../models/user.model.js"; // ESM style ✅

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      accessType: "offline",
      prompt: "consent",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const { givenName, familyName } = profile.name;
        const username = `${givenName}${familyName}`;

        console.log("Google profile:", profile);

        // 1. Try to find by socialMediaId and authProvider
        let user = await User.findOne({
          socialMediaId: profile.id,
          authProvider: "google",
        });

        // 2. If user not found, try to find by email and authProvider "local"
        if (!user) {
          user = await User.findOne({
            email: profile.emails?.[0]?.value,
            authProvider: "local",
          });

          // 2.a If found, update this user with Google details
          if (user) {
            user.socialMediaId = profile.id;
            user.authProvider = "google";
            await user.save();
            console.log("Linked existing local user to Google:", user);
          }
        }

        // 3. If still no user found, create a new user
        if (!user) {
          user = await User.create({
            firstName: givenName,
            lastName: familyName,
            username,
            email: profile.emails?.[0]?.value,
            authProvider: "google",
            socialMediaId: profile.id,
            isVerified: profile.emails?.[0]?.verified || false,
          });
          console.log("Created new Google user:", user);
        }

        return done(null, user);

      } catch (error) {
        console.error("❌ Google Auth Error:", error);
        return done(error, null);
      }
    }
  )
);
