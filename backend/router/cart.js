const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const { addToCart, getCart, removeFromCart, clearCart } = require('../Controller/cart');

// Add item to cart
router.post('/add', verifyToken, addToCart);
// Get current user's cart
router.get('/', verifyToken, getCart);
// Remove item from cart
router.delete('/remove/:cropId', verifyToken, removeFromCart);
// Clear cart
router.delete('/clear', verifyToken, clearCart);

module.exports = router; 