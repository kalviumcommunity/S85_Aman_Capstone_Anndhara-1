const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  cropId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Crop',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

favoriteSchema.index({ buyerId: 1, cropId: 1 }, { unique: true });

module.exports = mongoose.model('Favorite', favoriteSchema); 