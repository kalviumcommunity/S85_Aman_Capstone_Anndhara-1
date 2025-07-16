const express = require('express');
const app = express();

// const passport = require('../auth');
// app.use(passport.initialize());
// const localAuthMiddleware=passport.authenticate('local', { session: false });


const { createOrder, getOrders, updateOrder, getOrdersForFarmer, clearAllOrders } = require('../Controller/order');
const Notification = require('../model/Notification');
const verifyToken = require('../middleware/verifyToken');

const router = express.Router();


// Middleware to parse incoming requests
app.use(express.json());

// localAuthMiddleware

// Routes
router.post('/result', verifyToken, createOrder);
router.post('/create', verifyToken, createOrder);
router.get('/getResult', getOrders);
router.put('/update/:id', updateOrder);
router.get('/farmer/:farmerId', getOrdersForFarmer);
router.delete('/clearAll', clearAllOrders);

// Export the router
module.exports = router;
