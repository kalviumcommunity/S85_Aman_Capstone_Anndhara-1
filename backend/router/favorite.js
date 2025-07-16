const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const favoriteController = require('../Controller/favorite');

// Add favorite
router.post('/add', verifyToken, favoriteController.addFavorite);
// Remove favorite
router.delete('/remove', verifyToken, favoriteController.removeFavorite);
// Get all favorites for the logged-in buyer
router.get('/my', verifyToken, favoriteController.getFavoritesByBuyer);

module.exports = router; 