const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true // The farmer who receives the notification
  },
  crop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Crop',
    required: false
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: false
  },
  type: {
    type: String,
    enum: ['order_placed', 'order_cancelled', 'message', 'other'],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  read: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema); 