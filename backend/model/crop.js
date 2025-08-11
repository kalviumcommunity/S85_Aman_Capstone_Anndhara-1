const mongoose = require('mongoose');
const cropSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Crop name is required'],
        trim: true,
        minlength: [1, 'Crop name must be at least 1 character long'],
        maxlength: [100, 'Crop name cannot exceed 100 characters']
    },
    type: {
        type: String,
        required: [true, 'Crop type is required'],
        enum: ['vegetable', 'fruit', 'grain', 'spice', 'herb', 'other'],
        lowercase: true
    },
    pricePerKg: {
        type: Number,
        required: [true, 'Price per kg is required'],
        min: [0.01, 'Price must be greater than 0']
    },
    quantityKg: {
        type: Number,
        required: [true, 'Quantity is required'],
        min: [0.1, 'Quantity must be at least 0.1 kg']
    },
    imageUrl: {
        type: String,
        default: ''
    },
    imageData: {
        type: String, // Base64 encoded image data
        default: ''
    },
    imageContentType: {
        type: String,
        default: ''
    },
    location: {
        type: String,
        required: [true, 'Location is required'],
        trim: true,
        minlength: [2, 'Location must be at least 2 characters long']
    },
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    available: {
        type: Boolean,
        default: true
    },
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for full image URL
cropSchema.virtual('fullImageUrl').get(function() {
    return this.imageUrl ? `${process.env.BACKEND_URL || 'https://s85-aman-capstone-anndhara-1-8beh.onrender.com'}${this.imageUrl}` : null;
});

module.exports = mongoose.model('Crop', cropSchema);