const Notification = require('../model/Notification');

// Create a notification
const createNotification = async (req, res) => {
  try {
    const { user, crop, order, type, message } = req.body;
    if (!user || !type || !message) {
      return res.status(400).json({ error: 'user, type, and message are required' });
    }
    const notification = new Notification({ user, crop, order, type, message });
    await notification.save();
    res.status(201).json({ success: true, notification });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create notification', details: err.message });
  }
};

// Get notifications for a user (farmer)
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const notifications = await Notification.find({ user: userId }).sort({ createdAt: -1 });
    res.json({ success: true, notifications });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get notifications', details: err.message });
  }
};

// Mark a notification as read
const markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findByIdAndUpdate(id, { read: true }, { new: true });
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    res.json({ success: true, notification });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark notification as read', details: err.message });
  }
};

module.exports = { createNotification, getNotifications, markNotificationRead }; 