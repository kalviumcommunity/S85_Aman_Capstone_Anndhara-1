const Favorite = require('../model/Favorite');
const Crop = require('../model/crop');
const User = require('../model/user');

// Add a crop to favorites
exports.addFavorite = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const { cropId } = req.body;
    if (!cropId) return res.status(400).json({ error: 'cropId is required' });
    const user = await User.findById(buyerId);
    if (!user || user.role !== 'buyer') return res.status(403).json({ error: 'Only buyers can favorite crops' });
    const crop = await Crop.findById(cropId);
    if (!crop) return res.status(404).json({ error: 'Crop not found' });
    const favorite = await Favorite.findOneAndUpdate(
      { buyerId, cropId },
      { $setOnInsert: { buyerId, cropId } },
      { upsert: true, new: true }
    );
    return res.status(201).json({ success: true, favorite });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to add favorite', details: err.message });
  }
};

// Remove a crop from favorites
exports.removeFavorite = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const { cropId } = req.body;
    if (!cropId) return res.status(400).json({ error: 'cropId is required' });
    const user = await User.findById(buyerId);
    if (!user || user.role !== 'buyer') return res.status(403).json({ error: 'Only buyers can unfavorite crops' });
    const result = await Favorite.findOneAndDelete({ buyerId, cropId });
    if (!result) return res.status(404).json({ error: 'Favorite not found' });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to remove favorite', details: err.message });
  }
};

// Get all favorites for a buyer
exports.getFavoritesByBuyer = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const user = await User.findById(buyerId);
    if (!user || user.role !== 'buyer') return res.status(403).json({ error: 'Only buyers can view favorites' });
    const favorites = await Favorite.find({ buyerId }).populate('cropId');
    return res.json({ success: true, favorites });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch favorites', details: err.message });
  }
}; 