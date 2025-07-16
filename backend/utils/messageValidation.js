const mongoose = require('mongoose');
const User = require('../model/user');
const Crop = require('../model/crop');

// Validate ObjectId
function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// Validate user existence and role
async function validateUser(userId, expectedRole = null) {
  if (!isValidObjectId(userId)) {
    return { valid: false, error: 'Invalid user ID' };
  }
  const user = await User.findById(userId);
  if (!user) {
    return { valid: false, error: 'User not found' };
  }
  if (expectedRole && user.role !== expectedRole) {
    return { valid: false, error: `User is not a ${expectedRole}` };
  }
  return { valid: true, user };
}

// Validate crop existence
async function validateCrop(cropId) {
  if (!isValidObjectId(cropId)) {
    return { valid: false, error: 'Invalid crop ID' };
  }
  const crop = await Crop.findById(cropId);
  if (!crop) {
    return { valid: false, error: 'Crop not found' };
  }
  return { valid: true, crop };
}

// Validate role-based chat (buyer <-> farmer only)
function validateChatRoles(sender, receiver) {
  if (sender.role === receiver.role) {
    return { valid: false, error: 'Cannot message users with the same role' };
  }
  if (sender.role === 'buyer' && receiver.role !== 'farmer') {
    return { valid: false, error: 'Buyers can only message farmers' };
  }
  if (sender.role === 'farmer' && receiver.role !== 'buyer') {
    return { valid: false, error: 'Farmers can only message buyers' };
  }
  if (String(sender._id) === String(receiver._id)) {
    return { valid: false, error: 'Cannot message yourself' };
  }
  return { valid: true };
}

module.exports = {
  isValidObjectId,
  validateUser,
  validateCrop,
  validateChatRoles,
}; 