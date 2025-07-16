import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const FarmerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const user = JSON.parse(localStorage.getItem('user'));
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.role !== 'farmer') {
      navigate('/login');
      return;
    }
    fetch(`http://localhost:9001/order/farmer/${user._id || user.id}`)
      .then(res => res.json())
      .then(data => {
        setOrders(data.orders || []);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to fetch orders');
        setLoading(false);
      });
  }, [user, navigate]);

  const handleStatusChange = async (orderId, status) => {
    try {
      const res = await fetch(`http://localhost:9001/order/update/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error('Failed to update order');
      setOrders(orders => orders.map(o => o._id === orderId ? { ...o, status } : o));
    } catch {
      alert('Failed to update order status');
    }
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

  if (loading) return <div className='p-8 text-green-700'>Loading orders...</div>;
  if (error) return <div className='p-8 text-red-600'>{error}</div>;

  return (
    <div className='min-h-screen bg-white p-6'>
      <h2 className='text-2xl font-bold mb-4 text-green-700'>Orders for Your Crops</h2>
      {orders.length === 0 ? (
        <p className='text-gray-500'>No orders yet.</p>
      ) : (
        <>
          <table className='w-full border text-sm'>
            <thead>
              <tr className='bg-green-100'>
                <th className='p-2 border'>Buyer</th>
                <th className='p-2 border'>Crop</th>
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
                  <td className='p-2 border'>{order.buyer?.username}<br/><span className='text-xs text-gray-500'>{order.buyer?.email}</span></td>
                  <td className='p-2 border'>{order.crop?.name}<br/><span className='text-xs text-gray-500'>{order.crop?.type}</span></td>
                  <td className='p-2 border'>{order.quantityOrdered} kg</td>
                  <td className='p-2 border'>₹{order.proposedPrice}/kg</td>
                  <td className='p-2 border'>{order.address}</td>
                  <td className='p-2 border font-semibold'>{order.status}</td>
                  <td className='p-2 border'>
                    {order.status === 'pending' && (
                      <div className='flex gap-2'>
                        <button
                          className='bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700'
                          onClick={() => handleStatusChange(order._id, 'accepted')}
                        >Accept</button>
                        <button
                          className='bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600'
                          onClick={async () => {
                            const reason = window.prompt('Please provide a reason for rejection:');
                            if (!reason) return;
                            try {
                              const res = await fetch(`http://localhost:9001/order/update/${order._id}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ status: 'rejected', reason })
                              });
                              if (!res.ok) throw new Error('Failed to reject order');
                              setOrders(orders => orders.filter(o => o._id !== order._id));
                            } catch {
                              alert('Failed to reject order');
                            }
                          }}
                        >
                          Reject
                        </button>
                      </div>
                    )}
                    <button
                      className={`bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 mt-2 ${!order.crop?._id ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={() => {
                        if (order.crop && order.crop._id) {
                          navigate(`/chat/${order.buyer?._id || order.buyer?.id}?orderId=${order._id}&cropId=${order.crop._id}`);
                        }
                      }}
                      disabled={!order.crop || !order.crop._id}
                      title={!order.crop || !order.crop._id ? 'No crop context for this chat' : ''}
                    >
                      💬 Message
                    </button>
                    {['completed', 'cancelled', 'rejected'].includes(order.status) ? null : (
                      <button
                        className='bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 text-xs mt-2'
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
          {/* Delete All My Orders button (farmer only) */}
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

export default FarmerOrders; 