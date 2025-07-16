import { io } from 'socket.io-client';

const socket = io('http://localhost:9001', {
  autoConnect: false, // Only connect after login
});

// Join the socket server with userId after login
export function joinSocket(userId) {
  if (!socket.connected) socket.connect();
  socket.emit('join', userId);
}

// Listen for new notifications (for farmers)
export function onNewNotification(callback) {
  socket.on('newNotification', callback);
}

// Listen for new chat messages
export function onReceiveMessage(callback) {
  socket.on('receiveMessage', callback);
}

// Emit a message (with cropId/orderId context)
export function sendMessage({ sender, receiver, content, cropId, orderId }) {
  socket.emit('sendMessage', { sender, receiver, content, cropId, orderId });
}

// Emit a notification to a farmer
export function notifyFarmer({ user, crop, order, type, message }) {
  socket.emit('notifyFarmer', { user, crop, order, type, message });
}

export default socket;