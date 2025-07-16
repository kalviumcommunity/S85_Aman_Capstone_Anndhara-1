// router/auth.js
const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const router = express.Router();

// Step 1: Redirect user to Google for login
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Step 2: Google redirects here after login
router.get('/google/callback',
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
        res.redirect(`${process.env.FRONTEND_URL}/oauth-success?token=${token}`);
    }
);

module.exports = router;
