import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Cart = () => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const user = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();

  // Fetch cart items
  useEffect(() => {
    const fetchCart = async () => {
      setLoading(true);
      try {
        const res = await fetch("http://localhost:9001/cart/", {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        const data = await res.json();
        setCart(data.cart);
      } catch (err) {
        setCart(null);
      } finally {
        setLoading(false);
      }
    };
    if (user && user.token) fetchCart();
  }, [user?.token]);

  // Edit price/quantity
  const handleUpdateItem = async (cropId, quantity, proposedPrice) => {
    try {
      const res = await fetch("http://localhost:9001/cart/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ cropId, quantity, proposedPrice }),
      });
      const data = await res.json();
      if (data.success) {
        setCart(data.cart);
        setMessage("Cart updated!");
      } else {
        setMessage(data.error || "Failed to update cart.");
      }
    } catch (err) {
      setMessage("Failed to update cart.");
    }
    setTimeout(() => setMessage(""), 2000);
  };

  // Remove item
  const handleRemoveItem = async (cropId) => {
    try {
      const res = await fetch(`http://localhost:9001/cart/remove/${cropId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const data = await res.json();
      if (data.success) {
        setCart(data.cart);
        setMessage("Item removed from cart.");
      } else {
        setMessage(data.error || "Failed to remove item.");
      }
    } catch (err) {
      setMessage("Failed to remove item.");
    }
    setTimeout(() => setMessage(""), 2000);
  };

  if (loading) return <div className="p-4">Loading cart...</div>;
  if (!cart || !cart.items || cart.items.length === 0)
    return (
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-4">Cart</h2>
        <p>Your cart is empty.</p>
      </div>
    );

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Cart</h2>
      {message && <div className="text-green-700 font-semibold mb-2">{message}</div>}
      <ul>
        {cart.items.map((item, idx) => (
          <li key={item.cartItemId} className="mb-6 border-b pb-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">{item.crop ? item.crop.name : 'Unknown Crop'}</h3>
                <p>Farmer: {item.farmer?.username || 'N/A'}</p>
                <p>Price per Kg: ₹{item.crop ? item.crop.pricePerKg : 'N/A'}</p>
                <p>Proposed Price: ₹
                  <input
                    type="number"
                    value={item.proposedPrice || (item.crop ? item.crop.pricePerKg : 1)}
                    min={1}
                    className="border rounded px-2 py-1 w-24 ml-2"
                    onChange={e => {
                      const value = Number(e.target.value);
                      if (value > 0 && item.crop?._id && item.quantity > 0) {
                        handleUpdateItem(item.crop._id, item.quantity, value);
                      }
                    }}
                  />
                </p>
                <p>Quantity: 
                  <input
                    type="number"
                    value={item.quantity}
                    min={1}
                    max={item.crop ? item.crop.quantityKg : 999}
                    className="border rounded px-2 py-1 w-16 ml-2"
                    onChange={e => {
                      let value = Number(e.target.value);
                      if (value < 1) value = 1;
                      if (item.crop && value > item.crop.quantityKg) {
                        alert('Not available');
                        value = item.crop.quantityKg;
                      }
                      if (value > 0 && item.crop?._id && item.proposedPrice > 0) {
                        handleUpdateItem(item.crop._id, value, item.proposedPrice);
                      }
                    }}
                  />
                  / <span className="font-semibold text-green-700">{item.crop ? item.crop.quantityKg : '?'}</span> Kg available
                </p>
              </div>
              <div className="flex flex-col gap-2 items-end">
                <button
                  onClick={() => { if (item.crop && item.crop._id) handleRemoveItem(item.crop._id); }}
                  className={`bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 ${!item.crop || !item.crop._id ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={!item.crop || !item.crop._id}
                  title={!item.crop || !item.crop._id ? 'No crop to remove' : ''}
                >
                  Remove
                </button>
                <button
                  onClick={() => {
                    if (item.crop && item.crop._id) {
                      navigate(`/chat/${item.farmer._id}?cartItemId=${item.cartItemId}&cropId=${item.crop._id}`);
                    }
                  }}
                  className={`bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 ${!item.crop || !item.crop._id ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={!item.crop || !item.crop._id}
                  title={!item.crop || !item.crop._id ? 'No crop context for this chat' : ''}
                >
                  💬 Message
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-6">
        <button
          onClick={() => navigate('/checkout')}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold transition-colors mt-2"
        >
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
};

export default Cart; 