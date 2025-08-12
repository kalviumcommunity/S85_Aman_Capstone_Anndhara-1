// router/auth.js
const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const router = express.Router();

// Check if Google OAuth is configured
const isGoogleOAuthConfigured = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;

// Step 1: Redirect user to Google for login
router.get('/google', (req, res) => {
    if (!isGoogleOAuthConfigured) {
        return res.status(503).json({
            error: 'Google OAuth is not configured',
            message: 'Please contact the administrator to set up Google OAuth login'
        });
    }
    
    // Debug: Log the callback URL being used
    // const callbackURL = process.env.GOOGLE_CALLBACK_URL || "http://localhost:9001/auth/google/callback";
    // console.log('🔍 DEBUG: OAuth callback URL being used:', callbackURL);
    console.log('🔍 DEBUG: GOOGLE_CLIENT_ID exists:', !!process.env.GOOGLE_CLIENT_ID);
    console.log('🔍 DEBUG: GOOGLE_CLIENT_SECRET exists:', !!process.env.GOOGLE_CLIENT_SECRET);
    
    passport.authenticate('google', { scope: ['profile', 'email'] })(req, res);
});

// Step 2: Google redirects here after login
router.get('/google/callback',
    (req, res, next) => {
        if (!isGoogleOAuthConfigured) {
            return res.status(503).json({
                error: 'Google OAuth is not configured',
                message: 'Please contact the administrator to set up Google OAuth login'
            });
        }
        next();
    },
    passport.authenticate('google', { session: false, failureRedirect: '/login' }),
    (req, res) => {
        // Create JWT token after successful login
        const payload = {
            id: req.user._id,
            email: req.user.email,
            role: req.user.role,
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

        // Redirect frontend with token in query params (or cookie, your choice)
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        res.redirect(`${frontendUrl}/oauth-success?token=${token}`);
    }
);

module.exports = router;
