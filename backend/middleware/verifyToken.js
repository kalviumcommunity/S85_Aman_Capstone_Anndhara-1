const jwt = require('jsonwebtoken');
const User = require('../model/user');
const { handleServerError } = require('../utils/errorHandler');

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ message: 'No token provided' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Fetch latest user data from database to get current role
    const currentUser = await User.findById(decoded.id).select('-password');
    if (!currentUser) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    // Combine JWT data with latest user data from database
    req.user = {
      ...decoded,
      _id: currentUser._id,
      id: currentUser._id,
      role: currentUser.role,
      username: currentUser.username,
      email: currentUser.email,
      phone: currentUser.phone
    };
    
    next();
  } catch (err) {
    return handleServerError(res, err, 'Invalid or expired token', 401);
  }
};

module.exports = authMiddleware;
