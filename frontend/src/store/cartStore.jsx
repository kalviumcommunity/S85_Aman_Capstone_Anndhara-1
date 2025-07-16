import { useState, useEffect } from 'react';
import axios from 'axios';

export function useCart() {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('user'));

  // Helper to check if user is buyer
  const isBuyer = user && user.role === 'buyer';

  // Fetch cart from backend on mount
  useEffect(() => {
    if (!isBuyer) {
      setCart([]);
      setLoading(false);
      return;
    }
    const fetchCart = async () => {
      try {
        setLoading(true);
        const res = await axios.get('http://localhost:9001/cart/', {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setCart(res.data.cart?.items || []);
      } catch {
        setCart([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCart();
    // eslint-disable-next-line
  }, [user?.token]);

  // Add or update item in cart
  const addToCart = async (crop, quantity = 1, proposedPrice) => {
    if (!isBuyer) return;
    try {
      const res = await axios.post('http://localhost:9001/cart/add', {
        cropId: crop._id,
        quantity,
        proposedPrice: proposedPrice || crop.pricePerKg
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setCart(res.data.cart.items || []);
    } catch (err) {
      // Optionally handle error
    }
  };

  // Remove item from cart
  const removeFromCart = async (cropId) => {
    if (!isBuyer) return;
    try {
      const res = await axios.delete(`http://localhost:9001/cart/remove/${cropId}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setCart(res.data.cart.items || []);
    } catch (err) {
      // Optionally handle error
    }
  };

  // Clear cart
  const clearCart = async () => {
    if (!isBuyer) return;
    try {
      const res = await axios.delete('http://localhost:9001/cart/clear', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setCart([]);
    } catch (err) {
      // Optionally handle error
    }
  };

  // Update cart item (quantity or price)
  const updateCartItem = async (cropId, { quantity, proposedPrice }) => {
    if (!isBuyer) return;
    // Find the crop in cart
    const crop = cart.find(item => item.crop._id === cropId);
    if (!crop) return;
    await addToCart(crop.crop, quantity || crop.quantity, proposedPrice || crop.proposedPrice);
  };

  return { cart, loading, addToCart, removeFromCart, clearCart, updateCartItem };
} 