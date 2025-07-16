// === server.js ===
const express = require('express');
require('dotenv').config();
const fs = require('fs');
const http = require('http');
const cors = require('cors');
const passport = require('./auth.js');
const { Server } = require('socket.io');
const db = require('./db.js');
const Message = require('./model/Message');
const Notification = require('./model/Notification');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST'],
  },
});

// Middlewares
app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));

app.use((req, res, next) => {
  // console.log(`[${new Date().toLocaleString()}] Request Made to: ${req.originalUrl}`);
  next();
});

// Ensure uploads folder exists
if (!fs.existsSync('./uploads')) fs.mkdirSync('./uploads');
app.use('/uploads', express.static('uploads'));

// Auth
app.use(passport.initialize());

// Routes
app.use('/auth', require('./router/auth.js'));
app.use('/user', require('./router/user.js'));
app.use('/crop', require('./router/crop.js'));
app.use('/order', require('./router/order.js'));
app.use('/message', require('./router/Message.js'));
app.use('/rating', require('./router/rating.js'));
app.use('/cart', require('./router/cart.js'));
app.use('/favorite', require('./router/favorite.js'));
app.use('/notification', require('./router/notification.js'));

// Socket.IO map
const users = {}; // userId -> socketId

io.on('connection', (socket) => {
  // console.log('✅ New client connected:', socket.id);

  socket.on('join', (userId) => {
    users[userId] = socket.id;
    // console.log(`👤 User ${userId} connected with socket ID ${socket.id}`);
  });

  socket.on('sendMessage', async ({ sender, receiver, content, cropId, orderId }) => {
    const receiverSocket = users[receiver];
    // Save message to DB
    try {
      const messageData = {
        sender,
        receiver,
        content,
        cropId: cropId || null,
        orderId: orderId || null
      };
      const message = new Message(messageData);
      await message.save();
      // Emit to receiver if online
      if (receiverSocket) {
        io.to(receiverSocket).emit('receiveMessage', {
          sender,
          receiver,
          content,
          cropId: cropId || null,
          orderId: orderId || null,
          createdAt: message.createdAt,
        });
      }
      // Optionally, emit to sender for confirmation
      socket.emit('receiveMessage', {
        sender,
        receiver,
        content,
        cropId: cropId || null,
        orderId: orderId || null,
        createdAt: message.createdAt,
      });
    } catch (err) {
      socket.emit('error', { message: 'Failed to save message', error: err.message });
    }
  });

  // Listen for notification creation and emit to farmer
  socket.on('notifyFarmer', async ({ user, crop, order, type, message }) => {
    try {
      const notification = new Notification({ user, crop, order, type, message });
      await notification.save();
      const farmerSocket = users[user];
      if (farmerSocket) {
        io.to(farmerSocket).emit('newNotification', {
          user,
          crop,
          order,
          type,
          message,
          createdAt: notification.createdAt,
        });
      }
    } catch (err) {
      socket.emit('error', { message: 'Failed to create notification', error: err.message });
    }
  });

  socket.on('typing', ({ sender, receiver }) => {
    const receiverSocket = users[receiver];
    if (receiverSocket) {
      io.to(receiverSocket).emit('typing', { sender });
    }
  });

  socket.on('disconnect', () => {
    const user = Object.entries(users).find(([_, id]) => id === socket.id);
    if (user) {
      delete users[user[0]];
      // console.log(`❌ User ${user[0]} disconnected`);
    } else {
      // console.log(`❌ Unknown socket disconnected: ${socket.id}`);
    }
  });
});

const port = process.env.PORT || 9001;
db.connect().then(() => {
  server.listen(port, () => {
    // console.log(`🚀 Socket.IO server running at http://localhost:${port}`);
  });
}).catch((err) => {
  console.error('❌ Database connection failed:', err.message);
});
