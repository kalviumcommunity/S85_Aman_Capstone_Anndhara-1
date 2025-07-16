import React, { useState } from 'react';
import { useCart } from '../store/cartStore';
import { useNavigate } from 'react-router-dom';

const Checkout = () => {
  const { cart, clearCart } = useCart();
  const [address, setAddress] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    let validItems = cart.filter(item => item.crop && item.farmer);
    if (validItems.length === 0) {
      setError('No valid items in cart to order.');
      setLoading(false);
      return;
    }
    // Validate all fields for each item
    for (const [idx, item] of validItems.entries()) {
      if (!user?._id && !user?.id) {
        setError('User not found. Please log in again.');
        setLoading(false);
        return;
      }
      if (!item.crop?._id) {
        setError(`Cart item #${idx + 1} is missing crop information.`);
        setLoading(false);
        return;
      }
      if (!item.farmer?._id) {
        setError(`Cart item #${idx + 1} is missing farmer information.`);
        setLoading(false);
        return;
      }
      if (!item.quantity || isNaN(item.quantity) || Number(item.quantity) <= 0) {
        setError(`Cart item #${idx + 1} has invalid quantity.`);
        setLoading(false);
        return;
      }
      if (!item.proposedPrice || isNaN(item.proposedPrice) || Number(item.proposedPrice) <= 0) {
        setError(`Cart item #${idx + 1} has invalid price.`);
        setLoading(false);
        return;
      }
      if (!address.trim()) {
        setError('Please enter your delivery address.');
        setLoading(false);
        return;
      }
    }
    try {
      for (const item of validItems) {
        const orderBody = {
          buyer: user?._id || user?.id,
          crop: item.crop?._id,
          farmer: item.farmer?._id,
          quantityOrdered: String(item.quantity),
          proposedPrice: item.proposedPrice,
          address,
          status: 'pending',
        };
        console.log('Order request body:', orderBody); // Debug log
        const res = await fetch('http://localhost:9001/order/result', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify(orderBody)
        });
        let data;
        try {
          data = await res.json();
        } catch (jsonErr) {
          setError('Server error: Please check your order details and try again.');
          setLoading(false);
          return;
        }
        if (!res.ok || !data.success) {
          throw new Error(data.message || 'Order failed');
        }
      }
      setSuccess(true);
      clearCart();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUseCurrentLocation = async () => {
    setLocating(true);
    setError('');
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      setLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      try {
        // Use OpenStreetMap Nominatim for free reverse geocoding
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`);
        const data = await response.json();
        if (data && data.display_name) {
          setAddress(data.display_name);
        } else {
          setError('Could not determine address from location.');
        }
      } catch (err) {
        setError('Failed to fetch address from location.');
      } finally {
        setLocating(false);
      }
    }, (err) => {
      setError('Location access denied.');
      setLocating(false);
    });
  };

  if (success) {
    return (
      <div className='min-h-screen flex flex-col items-center justify-center bg-white'>
        <h2 className='text-2xl font-bold text-green-700 mb-4'>Order Placed!</h2>
        <p className='mb-4'>Thank you for your order. Your crops will be delivered soon.</p>
        <button className='bg-green-600 text-white px-4 py-2 rounded' onClick={() => navigate('/')}>Back to Home</button>
        <button className='bg-blue-600 text-white px-4 py-2 rounded mt-2' onClick={() => navigate('/buyer-orders')}>View My Orders</button>
      </div>
    );
  }

  return (
    <div className='min-h-screen flex flex-col items-center justify-center bg-white'>
      <h2 className='text-2xl font-bold text-green-700 mb-4'>Checkout</h2>
      <form className='w-full max-w-md bg-gray-50 p-6 rounded shadow' onSubmit={handleSubmit}>
        <div className='mb-4'>
          <label className='block mb-1 font-semibold'>Delivery Address</label>
          <div className="flex gap-2 items-center mb-2">
            <textarea
              className='w-full border rounded px-3 py-2'
              value={address}
              onChange={e => setAddress(e.target.value)}
              required
            />
            <button
              type="button"
              className="bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600 disabled:opacity-60"
              onClick={handleUseCurrentLocation}
              disabled={locating}
            >
              {locating ? 'Locating...' : 'Use Current Location'}
            </button>
          </div>
        </div>
        {error && <div className='text-red-600 mb-2'>{error}</div>}
        <button
          type='submit'
          className='bg-green-600 text-white px-4 py-2 rounded w-full hover:bg-green-700 disabled:opacity-60'
          disabled={loading}
        >{loading ? 'Placing Order...' : 'Place Order'}</button>
      </form>
    </div>
  );
};

export default Checkout; 