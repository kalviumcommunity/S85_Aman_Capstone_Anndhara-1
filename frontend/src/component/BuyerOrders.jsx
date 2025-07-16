import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const BuyerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const user = JSON.parse(localStorage.getItem('user'));
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.role !== 'buyer') {
      navigate('/login');
      return;
    }
    fetch(`http://localhost:9001/order/getResult?buyer=${user._id || user.id}`)
      .then(res => res.json())
      .then(data => {
        setOrders(data.orders || []);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to fetch orders');
        setLoading(false);
      });
  }, [user, navigate]);

  // Helper to get progress and color for each status
  const getOrderProgress = (status) => {
    const steps = ['pending', 'accepted', 'shipped', 'completed'];
    const cancelled = status === 'cancelled' || status === 'rejected';
    const idx = steps.indexOf(status);
    return {
      progress: cancelled ? 0 : ((idx + 1) / steps.length) * 100,
      color: cancelled ? 'bg-red-400' : idx === 3 ? 'bg-green-600' : 'bg-blue-500',
      label: cancelled ? (status.charAt(0).toUpperCase() + status.slice(1)) : (status.charAt(0).toUpperCase() + status.slice(1)),
      cancelled
    };
  };

  // Remove order handler
  const handleRemoveOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to remove this order?')) return;
    try {
      const res = await fetch(`http://localhost:9001/order/update/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' })
      });
      const data = await res.json();
      if (data.success) {
        setOrders(orders => orders.filter(o => o._id !== orderId));
      } else {
        alert(data.message || 'Failed to remove order.');
      }
    } catch {
      alert('Failed to remove order.');
    }
  };

  if (loading) return <div className='p-8 text-green-700'>Loading your orders...</div>;
  if (error) return <div className='p-8 text-red-600'>{error}</div>;

  return (
    <div className='min-h-screen bg-white p-6'>
      <h2 className='text-2xl font-bold mb-4 text-green-700'>My Orders</h2>
      {orders.length === 0 ? (
        <p className='text-gray-500'>You have not placed any orders yet.</p>
      ) : (
        <>
          <table className='w-full border text-sm'>
            <thead>
              <tr className='bg-green-100'>
                <th className='p-2 border'>Crop</th>
                <th className='p-2 border'>Farmer</th>
                <th className='p-2 border'>Quantity</th>
                <th className='p-2 border'>Proposed Price</th>
                <th className='p-2 border'>Address</th>
                <th className='p-2 border'>Status</th>
                <th className='p-2 border'>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order._id} className='border-b'>
                  <td className='p-2 border'>{order.crop?.name || 'N/A'}<br/><span className='text-xs text-gray-500'>{order.crop?.type}</span></td>
                  <td className='p-2 border'>{order.farmer?.username || 'N/A'}<br/><span className='text-xs text-gray-500'>{order.farmer?.email}</span></td>
                  <td className='p-2 border'>{order.quantityOrdered} kg</td>
                  <td className='p-2 border'>₹{order.proposedPrice}/kg</td>
                  <td className='p-2 border'>{order.address}</td>
                  <td className='p-2 border font-semibold'>
                    <div className='flex flex-col gap-1'>
                      <span>{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
                      {/* Progress bar */}
                      <div className='w-32 h-2 bg-gray-200 rounded'>
                        {(() => {
                          const { progress, color, label, cancelled } = getOrderProgress(order.status);
                          return (
                            <div
                              className={`${color} h-2 rounded transition-all duration-300`}
                              style={{ width: `${progress}%` }}
                              title={label}
                            ></div>
                          );
                        })()}
                      </div>
                    </div>
                  </td>
                  <td className='p-2 border'>
                    {['completed', 'cancelled', 'rejected'].includes(order.status) ? null : (
                      <button
                        className='bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 text-xs'
                        onClick={() => handleRemoveOrder(order._id)}
                      >
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Delete All My Orders button (buyer only) */}
          <button
            className='mt-6 bg-orange-600 text-white px-6 py-2 rounded hover:bg-orange-700 font-semibold w-full'
            onClick={async () => {
              if (!window.confirm('Are you sure you want to delete all your orders? This will cancel each order.')) return;
              try {
                for (const order of orders) {
                  await fetch(`http://localhost:9001/order/update/${order._id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'cancelled' })
                  });
                }
                setOrders([]);
              } catch {
                alert('Failed to delete all your orders.');
              }
            }}
          >
            Delete All My Orders
          </button>
        </>
      )}
    </div>
  );
};

export default BuyerOrders; 