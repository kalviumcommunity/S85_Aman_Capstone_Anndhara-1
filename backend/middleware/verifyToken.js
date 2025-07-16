const jwt = require('jsonwebtoken');
const { handleServerError } = require('../utils/errorHandler');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ message: 'No token provided' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { ...decoded, _id: decoded.id, id: decoded.id };
    next();
  } catch (err) {
    return handleServerError(res, err, 'Invalid or expired token', 401);
  }
};

module.exports = authMiddleware;
