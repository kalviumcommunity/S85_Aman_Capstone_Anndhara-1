const Rating = require('../model/Rating');
const { handleServerError } = require('../utils/errorHandler');
// http://localhost:9001/rating/Review
const createReview = async (req, res) => {
    try {
        const { reviewer, reviewedUser, rating, comment } = req.body;
        if (!reviewer || !reviewedUser || !rating || !comment) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        if (rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Rating must be between 1 and 5' });
        }
        const newReview = new Rating({
            reviewer, reviewedUser, rating, comment
        });
        await newReview.save();
        return res.status(201).json({ message: 'Review created successfull', newReview });

    } catch (error) {
        return handleServerError(res, error, 'Server error during ...');
    }
}
//http://localhost:9001/rating/getReview
const getReviews = async (req, res) => {
    try {
        const reviews = await Rating.find().populate('reviewer', 'username').populate('reviewedUser', 'username').sort({ createdAt: -1 });
    
        
        return res.status(200).json({
            ok:true,
            rating:reviews
        });
    } catch (error) {
        return handleServerError(res, error, 'Server error during ...');
    }
}
//http://localhost:9001/rating/update/680a7327838f7fd943820455
const putReviews = async (req, res) => {
    try {
        const { id } = req.params;
        const { rating, comment } = req.body;
        const updateData = {};
        if (rating !== undefined) updateData.rating = rating;
        if (comment) updateData.comment = comment;
        const updatedRating = await Rating.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
        if (!updatedRating) {
            return res.status(404).json({ success: false, message: 'Rating not found' });
        }
        return res.status(200).json({ success: true, message: 'Rating update successfully', data: updatedRating })
    } catch (error) {
        return handleServerError(res, error, 'Server error during ...');
    }
}
module.exports = {
    createReview,
    getReviews,
    putReviews
}