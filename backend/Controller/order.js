const { default: mongoose } = require('mongoose');
const Order = require('../model/order');
const Crop = require('../model/crop');
const { handleServerError } = require('../utils/errorHandler');
const Notification = require('../model/Notification');
const User = require('../model/user');
// http://localhost:9001/order/result
const createOrder = async (req, res) => {
    try {
        console.log('Order creation request body:', req.body);
        console.log('Order creation user:', req.user);
        const { crop, quantityOrdered, proposedPrice, address } = req.body;
        const buyer = req.user.id;
        if (!crop || !quantityOrdered || !proposedPrice || !address) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        const cropDoc = await Crop.findById(crop).populate('seller');
        if (!cropDoc) return res.status(404).json({ error: 'Crop not found' });
        const farmer = cropDoc.seller._id;
        const order = new Order({
            buyer,
            farmer,
            crop,
            quantityOrdered,
            proposedPrice,
            address,
            status: 'pending'
        });
        await order.save();
        res.status(201).json({ success: true, order });
    } catch (err) {
        console.error('Order creation error:', err);
        res.status(500).json({ error: 'Failed to place order', details: err.message, stack: err.stack });
    }
};
// http://localhost:9001/order/getResult?buyer=680b7ef2d2de61db25949891&status=pending
const getOrders = async (req, res) => {
    try {

        const { buyer, status } = req.query;

        let filter = {};
        if (buyer) {
            if (!mongoose.Types.ObjectId.isValid(buyer)) {
                return res.status(400).json({ message: 'Invalid buyer ID' });
            }
            filter.buyer = buyer;
        }
        if (status) {
            if (!['pending', 'accepted', 'shipped', 'completed', 'cancelled'].includes(status)) {
                return res.status(400).json({ message: 'Invalid Status' });
            }
            filter.status = status;
        }
        //fetch order based on the filter
        const orders = await Order.find(filter).populate('buyer', 'user email phone').sort({ createdAt: -1 });
        return res.status(200).json({ message: 'Order retrieved Successfully', orders })

    } catch (error) {
        return handleServerError(res, error, 'Server error during order retrieval');
    }

}
//http://localhost:9001/order/update/680cf10331cfd43b4a28736d
const updateOrder = async (req, res) => {
    try {
        console.log('Order update request params:', req.params);
        console.log('Order update request body:', req.body);
        const { id } = req.params;
        const { quantityOrdered, status, reason } = req.body;
        if (!quantityOrdered && !status && !reason) {
            return res.status(400).json({
                success: false,
                message: " At least 'quantityOrdered ', 'status', or 'reason' field is required to update. ",
            });
        }
        const updateData = {};
        if (quantityOrdered) updateData.quantityOrdered = quantityOrdered;
        if (status) updateData.status = status;
        if (reason) updateData.rejectionReason = reason;

        const updateOrder = await Order.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).populate('farmer').populate('buyer').populate('crop');

        if (!updateOrder) {
            return res.status(404).json({
                success: false,
                message: 'Order not found',
            })
        }

        // If order is accepted, update crop quantity
        if (status === 'accepted') {
            const Crop = require('../model/crop');
            const crop = await Crop.findById(updateOrder.crop);
            if (!crop) {
                return res.status(404).json({ success: false, message: 'Crop not found' });
            }
            const orderedQty = parseInt(updateOrder.quantityOrdered);
            if (isNaN(orderedQty) || orderedQty <= 0) {
                return res.status(400).json({ success: false, message: 'Invalid ordered quantity' });
            }
            crop.quantityKg = Math.max(0, crop.quantityKg - orderedQty);
            if (crop.quantityKg === 0) {
                crop.available = false;
                await crop.save(); // Mark as unavailable instead of deleting
                return res.status(200).json({
                    success: true,
                    message: 'Order accepted. Crop is now sold out and marked unavailable!',
                    data: updateOrder,
                    crop
                });
            }
            await crop.save();
            // Optionally, notify the farmer if sold out
            if (crop.quantityKg === 0) {
                return res.status(200).json({
                    success: true,
                    message: 'Order accepted. Crop is now sold out!',
                    data: updateOrder,
                    crop
                });
            }
        }

        // If order is rejected, notify the buyer with reason
        if (status === 'rejected') {
            // Create notification for buyer
            const buyerId = updateOrder.buyer._id;
            const farmerName = updateOrder.farmer.username || updateOrder.farmer.name || 'Farmer';
            const price = updateOrder.proposedPrice;
            const quantity = updateOrder.quantityOrdered;
            const cropName = updateOrder.crop.name || '';
            const rejectionReason = reason || updateOrder.rejectionReason || 'No reason provided.';
            const notifMsg = `Your order for ${quantity} kg of ${cropName} at ₹${price}/kg was rejected by ${farmerName}. Reason: ${rejectionReason}`;
            await Notification.create({
                user: buyerId,
                crop: updateOrder.crop._id,
                order: updateOrder._id,
                type: 'order_cancelled',
                message: notifMsg
            });
        }

        // If order is rejected or cancelled, remove it
        if (status === 'rejected' || status === 'cancelled') {
            await Order.findByIdAndDelete(id);
            return res.status(200).json({
                success: true,
                message: 'Order was removed.',
                removedOrderId: id
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Order updates Successfully!',
            data: updateOrder,
        });
    } catch (error) {
        console.error('Order update error:', error);
        return handleServerError(res, error, 'Server error during order update');
    }
}

const getOrdersForFarmer = async (req, res) => {
    try {
        const { farmerId } = req.params;
        if (!farmerId) {
            return res.status(400).json({ message: 'Farmer ID is required' });
        }
        // Find all crops owned by this farmer
        const Crop = require('../model/crop');
        const crops = await Crop.find({ seller: farmerId }).select('_id');
        const cropIds = crops.map(c => c._id);
        // Find all orders for these crops
        const orders = await Order.find({ crop: { $in: cropIds } })
            .populate('buyer', 'username email phone')
            .populate('crop', 'name type location');
        return res.status(200).json({ success: true, orders });
    } catch (error) {
        return handleServerError(res, error, 'Server error during fetching farmer orders');
    }
};

// DELETE all orders
const clearAllOrders = async (req, res) => {
    try {
        await Order.deleteMany({});
        res.status(200).json({ success: true, message: 'All orders have been deleted.' });
    } catch (error) {
        return handleServerError(res, error, 'Server error during clearing all orders');
    }
};

module.exports = {
    createOrder,
    getOrders,
    updateOrder,
    getOrdersForFarmer,
    clearAllOrders
}