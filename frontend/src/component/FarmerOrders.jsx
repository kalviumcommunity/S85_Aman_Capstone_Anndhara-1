import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const FarmerOrders = () => {
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
      order.buyer?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.crop?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.buyer?.email?.toLowerCase().includes(searchTerm.toLowerCase());
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
    totalRevenue: orders.filter(o => o.status === 'completed')
      .reduce((sum, o) => sum + (o.proposedPrice * o.quantityOrdered), 0)
  };

  useEffect(() => {
    if (!user || user.role !== 'farmer') {
      navigate('/login');
      return;
    }
    fetch(`https://s85-aman-capstone-anndhara-1-8beh.onrender.com/order/farmer/${user._id || user.id}`)
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
      const res = await fetch(`https://s85-aman-capstone-anndhara-1-8beh.onrender.com/order/update/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error('Failed to update order');
      setOrders(orders => orders.map(o => o._id === orderId ? { ...o, status } : o));
      
      // Show success alert based on status
      if (status === 'delivered') {
        alert('✅ Order marked as delivered successfully! The buyer will be notified.');
      } else if (status === 'accepted') {
        alert('✅ Order accepted successfully! You can now deliver the crop.');
      }
    } catch {
      alert('Failed to update order status');
    }
  };

  // Get status badge styling
  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      accepted: 'bg-blue-100 text-blue-800 border-blue-200',
      delivered: 'bg-purple-100 text-purple-800 border-purple-200',
      completed: 'bg-green-100 text-green-800 border-green-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
      cancelled: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return styles[status] || 'bg-gray-100 text-gray-800 border-gray-200';
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
    <div className='min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center'>
      <div className='text-center'>
        <div className='animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 mx-auto mb-4'></div>
        <p className='text-green-700 text-lg font-medium'>Loading your orders...</p>
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
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Header */}
        <div className='mb-8'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-2xl font-semibold text-gray-900'>Orders for Your Crops</h1>
              <p className='mt-1 text-sm text-gray-500'>Manage and track orders from buyers</p>
            </div>
            <div className='flex items-center space-x-4'>
              <div className='text-right'>
                <div className='text-lg font-medium text-gray-900'>{orders.length}</div>
                <div className='text-xs text-gray-500'>Total Orders</div>
              </div>
            </div>
          </div>
        </div>
          
        {/* Statistics Cards */}
        <div className='grid grid-cols-1 md:grid-cols-5 gap-6 mb-8'>
          <div className='bg-white overflow-hidden shadow rounded-lg'>
            <div className='p-5'>
              <div className='flex items-center'>
                <div className='flex-shrink-0'>
                  <div className='w-8 h-8 bg-yellow-100 rounded-md flex items-center justify-center'>
                    <span className='text-yellow-600 text-sm'>⏳</span>
                  </div>
                </div>
                <div className='ml-5 w-0 flex-1'>
                  <dl>
                    <dt className='text-sm font-medium text-gray-500 truncate'>Pending</dt>
                    <dd className='text-lg font-medium text-gray-900'>{orderStats.pending}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          
          <div className='bg-white overflow-hidden shadow rounded-lg'>
            <div className='p-5'>
              <div className='flex items-center'>
                <div className='flex-shrink-0'>
                  <div className='w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center'>
                    <span className='text-blue-600 text-sm'>✓</span>
                  </div>
                </div>
                <div className='ml-5 w-0 flex-1'>
                  <dl>
                    <dt className='text-sm font-medium text-gray-500 truncate'>Accepted</dt>
                    <dd className='text-lg font-medium text-gray-900'>{orderStats.accepted}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          
          <div className='bg-white overflow-hidden shadow rounded-lg'>
            <div className='p-5'>
              <div className='flex items-center'>
                <div className='flex-shrink-0'>
                  <div className='w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center'>
                    <span className='text-purple-600 text-sm'>🚚</span>
                  </div>
                </div>
                <div className='ml-5 w-0 flex-1'>
                  <dl>
                    <dt className='text-sm font-medium text-gray-500 truncate'>Delivered</dt>
                    <dd className='text-lg font-medium text-gray-900'>{orderStats.delivered}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          
          <div className='bg-white overflow-hidden shadow rounded-lg'>
            <div className='p-5'>
              <div className='flex items-center'>
                <div className='flex-shrink-0'>
                  <div className='w-8 h-8 bg-green-100 rounded-md flex items-center justify-center'>
                    <span className='text-green-600 text-sm'>✅</span>
                  </div>
                </div>
                <div className='ml-5 w-0 flex-1'>
                  <dl>
                    <dt className='text-sm font-medium text-gray-500 truncate'>Completed</dt>
                    <dd className='text-lg font-medium text-gray-900'>{orderStats.completed}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          
          <div className='bg-white overflow-hidden shadow rounded-lg'>
            <div className='p-5'>
              <div className='flex items-center'>
                <div className='flex-shrink-0'>
                  <div className='w-8 h-8 bg-indigo-100 rounded-md flex items-center justify-center'>
                    <span className='text-indigo-600 text-sm'>₹</span>
                  </div>
                </div>
                <div className='ml-5 w-0 flex-1'>
                  <dl>
                    <dt className='text-sm font-medium text-gray-500 truncate'>Revenue</dt>
                    <dd className='text-lg font-medium text-gray-900'>₹{orderStats.totalRevenue.toLocaleString()}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
          
        {/* Filters and Search */}
        <div className='bg-white shadow rounded-lg p-6 mb-6'>
          <div className='flex flex-col sm:flex-row gap-4'>
            <div className='flex-1'>
              <label htmlFor='search' className='sr-only'>Search</label>
              <div className='relative'>
                <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                  <svg className='h-5 w-5 text-gray-400' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
                  </svg>
                </div>
                <input
                  id='search'
                  type='text'
                  placeholder='Search by buyer name, email, or crop...'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className='block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
                />
              </div>
            </div>
            <div className='flex gap-4'>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className='block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md'
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
                className='block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md'
              >
                <option value='newest'>Newest First</option>
                <option value='oldest'>Oldest First</option>
                <option value='price-high'>Price: High to Low</option>
                <option value='price-low'>Price: Low to High</option>
                <option value='quantity-high'>Quantity: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          orders.length === 0 ? (
            <div className='bg-white shadow rounded-lg p-12 text-center'>
              <svg className='mx-auto h-12 w-12 text-gray-400' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' />
              </svg>
              <h3 className='mt-2 text-sm font-medium text-gray-900'>No orders</h3>
              <p className='mt-1 text-sm text-gray-500'>Get started by waiting for buyers to place orders for your crops.</p>
            </div>
          ) : (
            <div className='bg-white shadow rounded-lg p-12 text-center'>
              <svg className='mx-auto h-12 w-12 text-gray-400' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
              </svg>
              <h3 className='mt-2 text-sm font-medium text-gray-900'>No matching orders</h3>
              <p className='mt-1 text-sm text-gray-500'>Try adjusting your search or filter criteria.</p>
              <div className='mt-6'>
                <button
                  onClick={() => { setSearchTerm(''); setFilterStatus('all'); }}
                  className='inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                >
                  Clear filters
                </button>
              </div>
            </div>
          )
        ) : (
          <div className='bg-white shadow overflow-hidden sm:rounded-md'>
            <ul className='divide-y divide-gray-200'>
              {filteredOrders.map((order, index) => (
                <li key={order._id} className='px-6 py-4 hover:bg-gray-50'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center space-x-4'>
                      {/* Buyer Info */}
                      <div className='flex-shrink-0'>
                        <div className='w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center'>
                          <span className='text-gray-600 font-medium text-sm'>
                            {order.buyer?.username?.charAt(0)?.toUpperCase() || '?'}
                          </span>
                        </div>
                      </div>
                      <div className='flex-1 min-w-0'>
                        <div className='flex items-center justify-between'>
                          <div>
                            <p className='text-sm font-medium text-gray-900 truncate'>
                              {order.buyer?.username || 'Unknown Buyer'}
                            </p>
                            <p className='text-sm text-gray-500 truncate'>
                              {order.crop?.name || 'N/A'} • {order.quantityOrdered} kg • ₹{order.proposedPrice}/kg
                            </p>
                          </div>
                          <div className='flex items-center space-x-2'>
                            {/* Status Badge */}
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(order.status)}`}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                            
                            {/* Actions */}
                            <div className='flex items-center space-x-1'>
                              {order.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleStatusChange(order._id, 'accepted')}
                                    className='inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
                                  >
                                    Accept
                                  </button>
                                  <button
                                    onClick={async () => {
                                      const reason = window.prompt('Please provide a reason for rejection:');
                                      if (!reason) return;
                                      try {
                                        const res = await fetch(`https://s85-aman-capstone-anndhara-1-8beh.onrender.com/order/update/${order._id}`, {
                                          method: 'PUT',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ status: 'rejected', reason })
                                        });
                                        if (!res.ok) throw new Error('Failed to reject order');
                                        setOrders(orders => orders.filter(o => o._id !== order._id));
                                        alert('Order rejected successfully.');
                                      } catch {
                                        alert('Failed to reject order');
                                      }
                                    }}
                                    className='inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                              
                              {order.status === 'accepted' && (
                                <button
                                  onClick={() => handleStatusChange(order._id, 'delivered')}
                                  className='inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                                >
                                  Mark as Delivered
                                </button>
                              )}
                              
                              <button
                                onClick={() => {
                                  if (order.crop && order.crop._id) {
                                    navigate(`/chat/${order.buyer?._id || order.buyer?.id}?orderId=${order._id}&cropId=${order.crop._id}`);
                                  }
                                }}
                                disabled={!order.crop || !order.crop._id}
                                className='inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50'
                              >
                                Message
                              </button>
                              
                              {!['completed', 'cancelled', 'rejected'].includes(order.status) && (
                                <button
                                  onClick={() => handleRemoveOrder(order._id)}
                                  className='inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500'
                                >
                                  Remove
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className='mt-2 flex items-center text-sm text-gray-500'>
                          <svg className='flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' />
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 11a3 3 0 11-6 0 3 3 0 016 0z' />
                          </svg>
                          <span className='truncate'>{order.address}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            
            {/* Results summary */}
            <div className='bg-gray-50 px-6 py-3 border-t border-gray-200'>
              <div className='text-sm text-gray-700'>
                Showing <span className='font-medium'>{filteredOrders.length}</span> of{' '}
                <span className='font-medium'>{orders.length}</span> orders
                {searchTerm && (
                  <span> matching "<span className='font-medium'>{searchTerm}</span>"</span>
                )}
                {filterStatus !== 'all' && (
                  <span> with status "<span className='font-medium'>{filterStatus}</span>"</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FarmerOrders;