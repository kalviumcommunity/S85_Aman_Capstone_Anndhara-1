const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("./model/user");

// Check if Google OAuth is properly configured
const isGoogleOAuthConfigured = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;

if (isGoogleOAuthConfigured) {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "http://localhost:9001/auth/google/callback", // absolute URL
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            let user = await User.findOne({ googleId: profile.id });
            if (!user) {
                user = await User.create({
                    googleId: profile.id,
                    username: profile.displayName,
                    email: profile.emails[0].value,
                    password: 'google_oauth_user_' + Math.random().toString(36).substr(2, 9), // Generate random password for OAuth users
                    role: '', // Empty role - user must set it in profile
                    phone: '', // Empty phone that can be filled later in profile
                });
            }
            return done(null, user);
        } catch (err) {
            return done(err, null);
        }
    }));
} else {
    console.log('⚠️  Warning: Google OAuth not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.');
    console.log('💡 Google OAuth login will not work until these variables are set.');
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