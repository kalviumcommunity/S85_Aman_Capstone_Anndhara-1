import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const BuyerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const user = JSON.parse(localStorage.getItem('user'));
  const navigate = useNavigate();

  // Filter and sort orders
  const filteredOrders = orders.filter(order => {
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    const matchesSearch = !searchTerm || 
      order.farmer?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.crop?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.farmer?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'newest': return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      case 'oldest': return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      case 'price-high': return (b.proposedPrice || 0) - (a.proposedPrice || 0);
      case 'price-low': return (a.proposedPrice || 0) - (b.proposedPrice || 0);
      case 'quantity-high': return (b.quantityOrdered || 0) - (a.quantityOrdered || 0);
      default: return 0;
    }
  });

  // Get order statistics
  const orderStats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    accepted: orders.filter(o => o.status === 'accepted').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    completed: orders.filter(o => o.status === 'completed').length,
    totalSpent: orders.filter(o => o.status === 'completed')
      .reduce((sum, o) => sum + (o.proposedPrice * o.quantityOrdered), 0),
    avgOrderValue: orders.length > 0 ? 
      orders.reduce((sum, o) => sum + (o.proposedPrice * o.quantityOrdered), 0) / orders.length : 0
  };

  useEffect(() => {
    if (!user || user.role !== 'buyer') {
      navigate('/login');
      return;
    }
    fetch(`https://s85-aman-capstone-anndhara-1-8beh.onrender.com/order/getResult?buyer=${user._id || user.id}`)
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
    const statusConfig = {
      'pending': { progress: 25, color: 'bg-yellow-500', label: 'Pending' },
      'accepted': { progress: 50, color: 'bg-blue-500', label: 'Accepted' },
      'delivered': { progress: 75, color: 'bg-purple-500', label: 'Delivered' },
      'completed': { progress: 100, color: 'bg-green-500', label: 'Completed' },
      'cancelled': { progress: 0, color: 'bg-red-400', label: 'Cancelled' },
      'rejected': { progress: 0, color: 'bg-red-400', label: 'Rejected' }
    };
    
    const config = statusConfig[status] || statusConfig['pending'];
    return {
      progress: config.progress,
      color: config.color,
      label: config.label,
      cancelled: status === 'cancelled' || status === 'rejected'
    };
  };

  // Handle marking order as completed by buyer
  const handleMarkCompleted = async (orderId) => {
    try {
      const res = await fetch(`https://s85-aman-capstone-anndhara-1-8beh.onrender.com/order/update/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' })
      });
      if (!res.ok) throw new Error('Failed to mark order as completed');
      setOrders(orders => orders.map(o => o._id === orderId ? { ...o, status: 'completed' } : o));
      alert('✅ Order marked as completed successfully! Thank you for your purchase.');
    } catch {
      alert('Failed to mark order as completed');
    }
  };

  // Remove order handler
  const handleRemoveOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to remove this order?')) return;
    try {
      const res = await fetch(`https://s85-aman-capstone-anndhara-1-8beh.onrender.com/order/update/${orderId}`, {
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

  if (loading) return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center'>
      <div className='text-center'>
        <div className='animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4'></div>
        <p className='text-blue-700 text-lg font-medium'>Loading your orders...</p>
      </div>
    </div>
  );
  if (error) return (
    <div className='min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center'>
      <div className='text-center p-8 bg-white rounded-lg shadow-lg'>
        <div className='text-red-500 text-6xl mb-4'>⚠️</div>
        <p className='text-red-600 text-lg font-medium'>{error}</p>
      </div>
    </div>
  );

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6'>
      <div className='max-w-7xl mx-auto'>
        {/* Header */}
        <div className='bg-white rounded-lg shadow-lg p-6 mb-6'>
          <div className='flex items-center justify-between mb-6'>
            <div>
              <h2 className='text-3xl font-bold text-blue-700 mb-2'>🛒 My Orders Dashboard</h2>
              <p className='text-gray-600'>Track your crop orders and delivery status</p>
            </div>
            <div className='text-right'>
              <div className='text-2xl font-bold text-blue-600'>{orders.length}</div>
              <div className='text-sm text-gray-500'>Total Orders</div>
            </div>
          </div>
          
          {/* Statistics Cards */}
          <div className='grid grid-cols-2 md:grid-cols-6 gap-4 mb-6'>
            <div className='bg-gradient-to-r from-yellow-400 to-yellow-500 text-white p-4 rounded-lg text-center'>
              <div className='text-2xl font-bold'>{orderStats.pending}</div>
              <div className='text-sm opacity-90'>Pending</div>
            </div>
            <div className='bg-gradient-to-r from-blue-400 to-blue-500 text-white p-4 rounded-lg text-center'>
              <div className='text-2xl font-bold'>{orderStats.accepted}</div>
              <div className='text-sm opacity-90'>Accepted</div>
            </div>
            <div className='bg-gradient-to-r from-purple-400 to-purple-500 text-white p-4 rounded-lg text-center'>
              <div className='text-2xl font-bold'>{orderStats.delivered}</div>
              <div className='text-sm opacity-90'>Delivered</div>
            </div>
            <div className='bg-gradient-to-r from-green-400 to-green-500 text-white p-4 rounded-lg text-center'>
              <div className='text-2xl font-bold'>{orderStats.completed}</div>
              <div className='text-sm opacity-90'>Completed</div>
            </div>
            <div className='bg-gradient-to-r from-indigo-400 to-indigo-500 text-white p-4 rounded-lg text-center'>
              <div className='text-2xl font-bold'>₹{orderStats.totalSpent.toLocaleString()}</div>
              <div className='text-sm opacity-90'>Total Spent</div>
            </div>
            <div className='bg-gradient-to-r from-pink-400 to-pink-500 text-white p-4 rounded-lg text-center'>
              <div className='text-2xl font-bold'>₹{Math.round(orderStats.avgOrderValue).toLocaleString()}</div>
              <div className='text-sm opacity-90'>Avg Order</div>
            </div>
          </div>
          
          {/* Filters and Search */}
          <div className='flex flex-wrap gap-4 items-center'>
            <div className='flex-1 min-w-64'>
              <input
                type='text'
                placeholder='🔍 Search by farmer name, email, or crop...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className='px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500'
            >
              <option value='all'>All Status</option>
              <option value='pending'>Pending</option>
              <option value='accepted'>Accepted</option>
              <option value='delivered'>Delivered</option>
              <option value='completed'>Completed</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className='px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500'
            >
              <option value='newest'>Newest First</option>
              <option value='oldest'>Oldest First</option>
              <option value='price-high'>Price: High to Low</option>
              <option value='price-low'>Price: Low to High</option>
              <option value='quantity-high'>Quantity: High to Low</option>
            </select>
          </div>
        </div>
        {filteredOrders.length === 0 ? (
          orders.length === 0 ? (
            <div className='bg-white rounded-lg shadow-lg p-12 text-center'>
              <div className='text-6xl mb-4'>🛍️</div>
              <h3 className='text-xl font-semibold text-gray-700 mb-2'>No Orders Yet</h3>
              <p className='text-gray-500'>Your crop orders will appear here once you place them.</p>
            </div>
          ) : (
            <div className='bg-white rounded-lg shadow-lg p-12 text-center'>
              <div className='text-6xl mb-4'>🔍</div>
              <h3 className='text-xl font-semibold text-gray-700 mb-2'>No Matching Orders</h3>
              <p className='text-gray-500'>Try adjusting your search or filter criteria.</p>
              <button
                onClick={() => { setSearchTerm(''); setFilterStatus('all'); }}
                className='mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors'
              >
                Clear Filters
              </button>
            </div>
          )
        ) : (
          <>
            <div className='bg-white rounded-lg shadow-lg overflow-hidden'>
              <div className='overflow-x-auto'>
                <table className='w-full'>
                  <thead className='bg-gradient-to-r from-blue-600 to-purple-600 text-white'>
                    <tr>
                      <th className='px-6 py-4 text-left font-semibold'>Crop Details</th>
                      <th className='px-6 py-4 text-left font-semibold'>Farmer Info</th>
                      <th className='px-6 py-4 text-left font-semibold'>Quantity</th>
                      <th className='px-6 py-4 text-left font-semibold'>Price</th>
                      <th className='px-6 py-4 text-left font-semibold'>Delivery Address</th>
                      <th className='px-6 py-4 text-left font-semibold'>Status & Progress</th>
                      <th className='px-6 py-4 text-left font-semibold'>Actions</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-gray-200'>
                    {filteredOrders.map((order, index) => (
                      <tr key={order._id} className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                        <td className='px-6 py-4'>
                          <div>
                            <div className='font-medium text-gray-900'>{order.crop?.name || 'N/A'}</div>
                            <div className='text-sm text-gray-500 capitalize'>{order.crop?.type}</div>
                          </div>
                        </td>
                        <td className='px-6 py-4'>
                          <div className='flex items-center space-x-3'>
                            <div className='w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center'>
                              <span className='text-blue-600 font-semibold'>{order.farmer?.username?.charAt(0)?.toUpperCase() || '?'}</span>
                            </div>
                            <div>
                              <div className='font-medium text-gray-900'>{order.farmer?.username || 'Unknown'}</div>
                              <div className='text-sm text-gray-500'>{order.farmer?.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className='px-6 py-4'>
                          <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800'>
                            {order.quantityOrdered} kg
                          </span>
                        </td>
                        <td className='px-6 py-4'>
                          <div className='text-lg font-semibold text-blue-600'>₹{order.proposedPrice}</div>
                          <div className='text-xs text-gray-500'>per kg</div>
                        </td>
                        <td className='px-6 py-4'>
                          <div className='text-sm text-gray-900 max-w-xs truncate' title={order.address}>
                            📍 {order.address}
                          </div>
                        </td>
                        <td className='px-6 py-4'>
                          <div className='flex flex-col gap-2'>
                            <span className='text-sm font-medium text-gray-900'>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                            {/* Enhanced Progress bar */}
                            <div className='w-40 h-3 bg-gray-200 rounded-full overflow-hidden'>
                              {(() => {
                                const { progress, color, label, cancelled } = getOrderProgress(order.status);
                                return (
                                  <div
                                    className={`${color} h-3 rounded-full transition-all duration-500 flex items-center justify-center`}
                                    style={{ width: `${progress}%` }}
                                    title={label}
                                  >
                                    {progress > 20 && (
                                      <span className='text-xs text-white font-bold'>{Math.round(progress)}%</span>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        </td>
                        <td className='p-2 border'>
                          <div className='space-y-2'>
                            {order.status === 'delivered' && (
                              <button
                                className='bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm w-full'
                                onClick={() => handleMarkCompleted(order._id)}
                              >
                                Confirm Received
                              </button>
                            )}
                            {!['completed', 'cancelled', 'rejected'].includes(order.status) && (
                              <button
                                className='bg-red-400 hover:bg-red-500 text-white px-3 py-1 rounded text-sm w-full'
                                onClick={() => handleRemoveOrder(order._id)}
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {/* Results summary */}
                <div className='px-6 py-4 bg-gray-50 border-t text-sm text-gray-600'>
                  Showing {filteredOrders.length} of {orders.length} orders
                  {searchTerm && ` matching "${searchTerm}"`}
                  {filterStatus !== 'all' && ` with status "${filterStatus}"`}
                </div>
              </div>
            </div>
            {/* Action buttons */}
            <div className='mt-6 bg-white rounded-lg shadow-lg p-6'>
              <h3 className='text-lg font-semibold text-gray-800 mb-4'>Bulk Actions</h3>
              <button
                className='bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-lg hover:from-orange-600 hover:to-red-600 font-semibold w-full transition-all duration-200 flex items-center justify-center space-x-2'
                onClick={async () => {
                  if (!window.confirm('⚠️ Are you sure you want to cancel all your orders? This action cannot be undone.')) return;
                  try {
                    for (const order of orders) {
                      await fetch(`https://s85-aman-capstone-anndhara-1-8beh.onrender.com/order/update/${order._id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: 'cancelled' })
                      });
                    }
                    setOrders([]);
                    alert('✅ All orders have been cancelled successfully.');
                  } catch {
                    alert('❌ Failed to cancel all orders.');
                  }
                }}
              >
                <span>🗑️</span>
                <span>Cancel All Orders</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BuyerOrders;