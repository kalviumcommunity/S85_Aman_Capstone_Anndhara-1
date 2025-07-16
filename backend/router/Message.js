const express = require('express');
const router = express.Router();
const { getMessages, sendMessage, getBuyersForFarmer, testMessageModel, createTestData, minimalTest, markMessagesAsRead, getUnreadCountsForFarmer, clearChatMessages } = require('../Controller/Message');
const verifyToken = require('../middleware/verifyToken');

// Completely minimal test route
router.get('/ping', (req, res) => {
  res.json({ message: 'PONG - Message router is working!' });
});

// Minimal test function route
router.get('/minimal-test/:farmerId', minimalTest);

// Simple test route without auth
router.get('/test/simple', (req, res) => {
  res.json({ message: 'Message routes are working!' });
});

// Test version without auth to isolate the issue
router.get('/buyers-test/:farmerId', (req, res) => {
  res.json({ 
    message: 'Buyers route works without auth',
    farmerId: req.params.farmerId,
    params: req.params
  });
});

// Specific routes first (more specific before generic)
router.get('/buyers/:farmerId', verifyToken, getBuyersForFarmer); // get buyers for farmer
router.get('/test/model', testMessageModel); // test Message model
router.post('/test/create-data', createTestData); // create test data

// --- UNREAD/READ ROUTES MUST COME BEFORE GENERIC ROUTES ---
router.get('/unread-counts/:farmerId', verifyToken, getUnreadCountsForFarmer);
router.post('/mark-read/:farmerId/:buyerId', verifyToken, markMessagesAsRead);

// Generic routes last
router.get('/:userId/:otherUserId', verifyToken, getMessages); // fetch chat history
router.post('/', verifyToken, sendMessage); // send a message

// Clear all messages for a given orderId, cartItemId, or cropId between two users
router.delete('/clear', verifyToken, clearChatMessages);

module.exports = router;