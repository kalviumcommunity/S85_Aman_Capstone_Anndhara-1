const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("./model/user");

const isGoogleOAuthConfigured =
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;

if (isGoogleOAuthConfigured) {
  const callbackURL =
    process.env.NODE_ENV === "production"
      ? process.env.GOOGLE_CALLBACK_URL_PROD || "https://s85-aman-capstone-anndhara-1-8beh.onrender.com/auth/google/callback"
      : process.env.GOOGLE_CALLBACK_URL_LOCAL || "http://localhost:9001/auth/google/callback";

  console.log("✅ Google OAuth Configured");
  console.log("🌍 NODE_ENV:", process.env.NODE_ENV);
  console.log("🔗 Using Google Callback URL:", callbackURL);

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          console.log("🔑 Access Token received from Google");
          let user = await User.findOne({ googleId: profile.id });

          if (!user) {
            user = await User.findOne({ email: profile.emails[0].value });

            if (user) {
              user.googleId = profile.id;
              await user.save();
              console.log("📌 Linked Google account to existing user");
            } else {
              user = await User.create({
                googleId: profile.id,
                username: profile.displayName,
                email: profile.emails[0].value,
                password: "google_oauth_user_" + Math.random().toString(36).substr(2, 9),
                role: "",
                phone: "",
              });
              console.log("🆕 Created new Google user");
            }
          }
          return done(null, user);
        } catch (err) {
          console.error("❌ Error in Google Strategy:", err);
          return done(err, null);
        }
      }
    )
  );
} else {
  console.log("⚠️ Google OAuth not configured. Set GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET.");
}

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
