import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaBell, FaHeart, FaShoppingCart, FaUserCircle } from 'react-icons/fa';
import { useUser } from '../store/authStore';
import { useCart } from '../store/cartStore';

const Navbar = ({ notifications, setNotifications, selectedCategory, setSelectedCategory }) => {
  const { user, isFarmer, isBuyer, hasRole } = useUser();
  const { cart } = useCart();
  const [showDropdown, setShowDropdown] = useState(false);

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
    <nav className='flex flex-wrap items-center justify-between bg-white shadow-md px-6 py-4'>
      <Link to="/" className='text-3xl font-extrabold text-green-700'>Annadhara</Link>
      
      <form className='flex-grow max-w-xs mx-4'>
        <input
          type="search"
          placeholder='Search Product'
          className='w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-green-500'
        />
      </form>
      
      {/* Category Filters - Show for all visitors and buyers */}
      {(!user || !user.token || isBuyer || !hasRole) && (
        <ul className='hidden lg:flex space-x-6 text-sm font-semibold text-orange-600'>
          {categories.map((item, i) => (
            <li key={item}>
              <button
                onClick={() => setSelectedCategory(item)}
                className={`flex items-center gap-1 hover:text-green-700 ${selectedCategory === item ? 'text-green-700 font-bold' : ''}`}
              >
                <span className='text-lg'>{categoryIcons[i]}</span>
                {item}
              </button>
            </li>
          ))}
        </ul>
      )}
      
      <div className='flex space-x-2 items-center'>
        {/* Cart - Only show for logged-in users */}
        {user && user.token && (
          <Link to="/cart" className='relative flex items-center px-3 py-1 rounded-full hover:bg-green-100 transition-all'>
            <FaShoppingCart className='text-2xl text-green-700' />
            {cart.length > 0 && (
              <span className='absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full px-1'>{cart.length}</span>
            )}
          </Link>
        )}
        
        {user && user.token ? (
          <>
            <Link to="/profile" className='flex items-center gap-2 px-3 py-1 rounded-full hover:bg-green-100 transition-all'>
              <FaUserCircle className='text-2xl text-green-700' />
              <span className='hidden md:inline text-green-700 font-semibold'>{user.username || 'User'}</span>
            </Link>
            
            {isFarmer && (
              <>
                <Link 
                  to="/farmer-messages" 
                  className='bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-semibold transition-all'
                >
                  💬 Messages
                </Link>
                <Link
                  to="/farmer-orders"
                  className='bg-orange-500 text-white px-3 py-1 rounded hover:bg-orange-600 font-semibold transition-all'
                >
                  📦 My Orders
                </Link>
                <Link to="/crop-upload" className='bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 font-semibold transition-all'>
                  <b>Upload Crop</b>
                </Link>
              </>
            )}
            
            {isBuyer && (
              <>
                <Link to="/buyer-orders" className='bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 font-semibold transition-all'>
                  📦 My Orders
                </Link>
                <Link to="/favorites" className='bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 font-semibold transition-all'>
                  ❤️ Favorites
                </Link>
              </>
            )}
            
            {!hasRole && (
              <Link to="/profile" className='bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 font-semibold transition-all'>
                ⚠️ Set Your Role
              </Link>
            )}
            
            {/* Notification bell */}
            <div className="relative">
              <button
                className="relative focus:outline-none"
                onClick={() => setShowDropdown(!showDropdown)}
              >
                <FaBell className="text-2xl text-green-700" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1">
                    {unreadCount}
                  </span>
                )}
              </button>
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-white border rounded shadow-lg z-50 max-h-96 overflow-y-auto">
                  <div className="p-2 font-semibold border-b">Notifications</div>
                  {notifications.length === 0 ? (
                    <div className="p-4 text-gray-500">No notifications</div>
                  ) : (
                    notifications.map((notif, idx) => (
                      <div
                        key={idx}
                        className={`p-3 border-b hover:bg-gray-100 cursor-pointer ${notif.read ? 'opacity-60' : ''}`}
                        onClick={() => handleMarkAsRead(idx)}
                      >
                        <div className="font-medium">{notif.message}</div>
                        <div className="text-xs text-gray-500">{new Date(notif.createdAt).toLocaleString()}</div>
                      </div>
                    ))
                  )}
                  <div className="p-2 text-center border-t">
                    <Link to="/notifications" className="text-green-700 font-semibold hover:underline">View All Notifications</Link>
                  </div>
                </div>
              )}
            </div>

            {/* Logout Button */}
            <button
              onClick={() => {
                localStorage.removeItem('user');
                window.location.href = '/';
              }}
              className='bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 font-semibold transition-all'
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className='bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 font-semibold transition-all'>
              <b>Login</b>
            </Link>
            <Link to="/register" className='bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 font-semibold transition-all'>
              <b>Sign</b>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar; 