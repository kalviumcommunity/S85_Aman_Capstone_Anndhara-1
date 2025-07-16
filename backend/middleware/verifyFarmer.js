const { handleServerError } = require('../utils/errorHandler');

const verifyFarmer = (req, res, next) => {
    if (!req.user) {
        return handleServerError(res, new Error('Authentication required.'), 'Authentication required.', 401);
    }
    if (req.user.role !== 'farmer') {
        return handleServerError(res, new Error('Only farmers can upload crop details.'), 'Only farmers can upload crop details.', 403);
    }
    next();
};

module.exports = verifyFarmer;