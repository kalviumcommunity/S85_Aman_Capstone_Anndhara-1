const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    cartItemId: {
        type: String,
        required: false, // Optional - for cart item-specific chats
    },
    cropId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Crop',
        required: false, // Optional - for general inquiries
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: false, // Optional - for order-specific chats
    },
    read: {
        type: Boolean,
        default: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
