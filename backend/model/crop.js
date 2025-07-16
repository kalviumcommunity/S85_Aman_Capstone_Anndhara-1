const mongoose = require('mongoose');
const cropSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    type: String, //vegetable,fruit
    pricePerKg: {
        type: Number,
        required: true
    },
    quantityKg: {
        type: Number,
        required: true
    },
    imageUrl: String,
    location: String,
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    available: {
        type: Boolean,
        default: true
    },
}, { timestamps: true });
module.exports = mongoose.model('Crop', cropSchema);