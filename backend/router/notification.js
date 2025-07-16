const express = require('express');
const router = express.Router();
const { createNotification, getNotifications, markNotificationRead } = require('../Controller/notification');
const verifyToken = require('../middleware/verifyToken');

// Create a notification
router.post('/', verifyToken, createNotification);
// Get notifications for the logged-in user
router.get('/', verifyToken, getNotifications);
// Mark a notification as read
router.put('/:id/read', verifyToken, markNotificationRead);

module.exports = router; 