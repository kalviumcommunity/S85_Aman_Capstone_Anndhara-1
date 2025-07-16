const Cart = require('../model/cart');
const Crop = require('../model/crop');
const { v4: uuidv4 } = require('uuid');

// Add or update an item in the cart
const addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { cropId, quantity, proposedPrice } = req.body;
    if (!cropId || !quantity) {
      return res.status(400).json({ error: 'cropId and quantity are required' });
    }
    // Ensure crop exists
    const crop = await Crop.findById(cropId);
    if (!crop) {
      return res.status(404).json({ error: 'Crop not found' });
    }
    const farmerId = crop.seller; // Get the farmer from the crop
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }
    // Check if the crop is already in the cart
    const existingItem = cart.items.find(item => item.crop.toString() === cropId);
    if (existingItem) {
      // Update quantity and proposedPrice
      existingItem.quantity = quantity;
      existingItem.proposedPrice = proposedPrice;
    } else {
      // Add new item
      cart.items.push({ cartItemId: uuidv4(), crop: cropId, quantity, proposedPrice, farmer: farmerId });
    }
    await cart.save();
    const populatedCart = await Cart.findById(cart._id).populate('items.crop').populate('items.farmer');
    res.json({ success: true, cart: populatedCart });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add to cart', details: err.message });
  }
};

// Get the current user's cart
const getCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const cart = await Cart.findOne({ user: userId }).populate('items.crop').populate('items.farmer');
    res.json({ success: true, cart });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get cart', details: err.message });
  }
};

// Remove an item from the cart
const removeFromCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { cropId } = req.params;
    let cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ error: 'Cart not found' });
    cart.items = cart.items.filter(item => item.crop.toString() !== cropId);
    await cart.save();
    res.json({ success: true, cart });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove from cart', details: err.message });
  }
};

// Clear the cart
const clearCart = async (req, res) => {
  try {
    const userId = req.user.id;
    let cart = await Cart.findOne({ user: userId });
    console.log(cart);
    if (!cart) return res.status(404).json({ error: 'Cart not found' });

    cart.items = [];
    await cart.save();
    
    res.json({ success: true, cart });
  } catch (err) {
    console.log(err);
    console.log(err.message);
    console.log('Hello');
    
    res.status(500).json({ error: 'Failed to clear cart', details: err.message });
  }
};

module.exports = { addToCart, getCart, removeFromCart, clearCart }; 