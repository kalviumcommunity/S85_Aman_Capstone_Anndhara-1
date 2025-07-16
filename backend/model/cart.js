const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const cartItemSchema = new mongoose.Schema({
  cartItemId: {
    type: String,
    default: uuidv4,
    unique: true
  },
  crop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Crop',
    required: true
  },
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    default: 1
  },
  proposedPrice: {
    type: Number,
    required: false
  }
});

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [cartItemSchema]
}, { timestamps: true });

module.exports = mongoose.model('Cart', cartSchema); 