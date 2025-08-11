import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaBell, FaHeart, FaShoppingCart, FaUserCircle } from 'react-icons/fa';
import { useUser } from '../store/authStore';
import { useCart } from '../store/cartStore';

const Navbar = ({ notifications, setNotifications, selectedCategory, setSelectedCategory, searchQuery, setSearchQuery }) => {
  const { user, isFarmer, isBuyer, hasRole } = useUser();
  const { cart } = useCart();
  const [showDropdown, setShowDropdown] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState('');

  const categories = ['Crops', 'Vegetable', 'Fruits', 'Nursery & Plants', 'Dry Fruits'];
  const categoryIcons = ['🌾', '🥕', '🍎', '🌿', '🥜'];

  // Debug logging
  if (import.meta.env.MODE === 'development') {
    console.log('Navbar - User state:', { 
      user: !!user, 
      hasToken: !!(user && user.token), 
      isLoggedIn: !!(user && user.token),
      username: user?.username 
    });
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = (index) => {
    setNotifications(prev => {
      const updated = [...prev];
      updated[index].read = true;
      return updated;
    });
    // TODO: Optionally call backend to mark as read
  };

  return (
    <nav className='sticky top-0 z-50 bg-white/95 backdrop-blur-sm shadow-md border-b border-green-100 transition-all duration-300'>
      <div className='max-w-full mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex items-center justify-between h-16 gap-2 sm:gap-4'>
          {/* Compact Logo */}
          <Link to="/" className='flex items-center space-x-2 text-xl sm:text-2xl font-semibold text-green-700 hover:text-green-600 transition-colors duration-200 flex-shrink-0'>
            <span className='text-2xl sm:text-3xl'>🌾</span>
            <span className='hidden sm:inline'>Annadhara</span>
          </Link>
      
          {/* Responsive Search Bar */}
          <div className='flex-1 max-w-md mx-2 sm:mx-4 lg:mx-8'>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (setSearchQuery) setSearchQuery(localSearchQuery);
            }}>
              <div className='relative'>
                <input
                  type="search"
                  placeholder='Search crops...'
                  value={localSearchQuery}
                  onChange={(e) => {
                    setLocalSearchQuery(e.target.value);
                    if (setSearchQuery) setSearchQuery(e.target.value);
                  }}
                  className='w-full bg-gray-50 border border-gray-200 rounded-full px-4 py-2 pl-10 focus:outline-none focus:border-green-400 focus:bg-white transition-all duration-200 text-sm'
                />
                <div className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400'>
                  <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
                  </svg>
                </div>
              </div>
            </form>
          </div>
      
          {/* Compact Category Filters */}
          {(!user || !user.token || isBuyer || !hasRole) && (
            <div className='hidden lg:flex space-x-1'>
              {categories.map((item, i) => (
                <button
                  key={item}
                  onClick={() => setSelectedCategory(item)}
                  className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs transition-all duration-200 ${
                    selectedCategory === item 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-600'
                  }`}
                >
                  <span className='text-sm'>{categoryIcons[i]}</span>
                  <span className='hidden xl:inline'>{item}</span>
                </button>
              ))}
            </div>
          )}
      
          <div className='flex items-center space-x-1 sm:space-x-2 overflow-x-auto'>
            {/* Compact Cart */}
            {user && user.token && (
              <Link to="/cart" className='relative flex items-center p-2 rounded-lg bg-green-50 hover:bg-green-100 transition-all duration-200 flex-shrink-0'>
                <FaShoppingCart className='text-lg text-green-700' />
                {cart.length > 0 && (
                  <span className='absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center'>{cart.length}</span>
                )}
              </Link>
            )}
            
            {user && user.token ? (
              <>
                {/* Profile */}
                <Link to="/profile" className='flex items-center gap-1 px-2 py-2 rounded-lg bg-green-50 hover:bg-green-100 transition-all duration-200 flex-shrink-0'>
                  <FaUserCircle className='text-lg text-green-700' />
                  <span className='hidden lg:inline text-green-700 text-sm'>{user.username || 'User'}</span>
                </Link>
                
                {/* Farmer Links */}
                {isFarmer && (
                  <>
                    <Link 
                      to="/farmer-messages" 
                      className='flex items-center gap-1 bg-blue-500 text-white px-2 py-2 rounded-lg hover:bg-blue-600 transition-all duration-200 text-xs flex-shrink-0'
                    >
                      💬 <span className='hidden md:inline'>Messages</span>
                    </Link>
                    <Link
                      to="/farmer-orders"
                      className='flex items-center gap-1 bg-orange-500 text-white px-2 py-2 rounded-lg hover:bg-orange-600 transition-all duration-200 text-xs flex-shrink-0'
                    >
                      📦 <span className='hidden md:inline'>Orders</span>
                    </Link>
                    <Link to="/crop-upload" className='flex items-center gap-1 bg-green-500 text-white px-2 py-2 rounded-lg hover:bg-green-600 transition-all duration-200 text-xs flex-shrink-0'>
                      🌱 <span className='hidden md:inline'>Upload</span>
                    </Link>
                  </>
                )}
                
                {/* Buyer Links */}
                {isBuyer && (
                  <>
                    <Link to="/buyer-orders" className='flex items-center gap-1 bg-green-600 text-white px-2 py-2 rounded-lg hover:bg-green-700 transition-all duration-200 text-xs flex-shrink-0'>
                      📦 <span className='hidden md:inline'>Orders</span>
                    </Link>
                    <Link to="/favorites" className='flex items-center gap-1 bg-red-500 text-white px-2 py-2 rounded-lg hover:bg-red-600 transition-all duration-200 text-xs flex-shrink-0'>
                      ❤️ <span className='hidden md:inline'>Favorites</span>
                    </Link>
                  </>
                )}
                
                {/* Role Setting */}
                {!hasRole && (
                  <Link to="/profile" className='flex items-center gap-1 bg-yellow-500 text-white px-2 py-2 rounded-lg hover:bg-yellow-600 transition-all duration-200 text-xs animate-pulse flex-shrink-0'>
                    ⚠️ <span className='hidden md:inline'>Role</span>
                  </Link>
                )}
                
                {/* Notifications */}
                <div className="relative flex-shrink-0">
                  <button
                    className="relative p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all duration-200"
                    onClick={() => setShowDropdown(!showDropdown)}
                  >
                    <FaBell className="text-lg text-green-700" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                  {showDropdown && (
                    <div className="absolute right-0 mt-2 w-72 bg-white border rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto">
                      <div className="p-3 font-medium border-b bg-green-50">Notifications</div>
                      {notifications.length === 0 ? (
                        <div className="p-4 text-gray-500 text-center">No notifications</div>
                      ) : (
                        notifications.map((notif, idx) => (
                          <div
                            key={idx}
                            className={`p-3 border-b hover:bg-gray-50 cursor-pointer transition-colors ${notif.read ? 'opacity-60' : ''}`}
                            onClick={() => handleMarkAsRead(idx)}
                          >
                            <div className="font-medium text-sm">{notif.message}</div>
                            <div className="text-xs text-gray-500 mt-1">{new Date(notif.createdAt).toLocaleString()}</div>
                          </div>
                        ))
                      )}
                      <div className="p-2 text-center border-t">
                        <Link to="/notifications" className="text-green-700 text-sm hover:underline">View All</Link>
                      </div>
                    </div>
                  )}
                </div>

                {/* Logout */}
                <button
                  onClick={() => {
                    localStorage.removeItem('user');
                    window.location.href = '/';
                  }}
                  className='flex items-center gap-1 bg-red-500 text-white px-2 py-2 rounded-lg hover:bg-red-600 transition-all duration-200 text-xs flex-shrink-0'
                >
                  🚪 <span className='hidden md:inline'>Logout</span>
                </button>
              </>
            ) : (
              <>
                {/* Auth Buttons */}
                <Link to="/login" className='flex items-center gap-1 bg-green-500 text-white px-3 py-2 rounded-lg hover:bg-green-600 transition-all duration-200 text-sm flex-shrink-0'>
                  🔑 <span>Login</span>
                </Link>
                <Link to="/register" className='flex items-center gap-1 bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 transition-all duration-200 text-sm flex-shrink-0'>
                  📝 <span>Register</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 