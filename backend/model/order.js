const mongoose = require('mongoose');
const orderSchema = new mongoose.Schema({
    buyer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    crop: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Crop',
        required: true,
    },
    farmer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    quantityOrdered: {
        type: String,
        required: true,
    },
    proposedPrice: {
        type: Number,
        required: true,
    },
    address: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'shipped', 'completed', 'cancelled', 'rejected'],
        default: 'pending',
    },
    rejectionReason: {
        type: String,
        required: false
    }
},{timestamps:true});

    module.exports=mongoose.model('Order',orderSchema)