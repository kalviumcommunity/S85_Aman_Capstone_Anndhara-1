const { handleServerError } = require('../utils/errorHandler');

const verifyFarmer = (req, res, next) => {
    if (!req.user) {
        return handleServerError(res, new Error('Authentication required.'), 'Authentication required.', 401);
    }
    
    // Check if user has no role set yet
    if (!req.user.role || req.user.role === '') {
        return res.status(403).json({
            success: false,
            message: 'Please set your role to "farmer" in your profile settings to upload crops.',
            requiresRoleSetup: true
        });
    }
    
    if (req.user.role !== 'farmer') {
        return res.status(403).json({
            success: false,
            message: 'Only farmers can upload crop details. Please update your role in profile settings if you are a farmer.',
            currentRole: req.user.role
        });
    }
    
    next();
};

module.exports = verifyFarmer;