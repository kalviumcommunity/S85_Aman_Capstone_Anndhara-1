import React, { useState } from 'react';
import { FaBell } from 'react-icons/fa';
import { FaHeart } from 'react-icons/fa';

const Navbar = ({ notifications, setNotifications }) => {
  const user = JSON.parse(localStorage.getItem('user'));
  const [showDropdown, setShowDropdown] = useState(false);

  if (!user) return null;
  const isFarmer = user.role === 'farmer';
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
    <nav className="flex items-center justify-between px-4 py-2 bg-white shadow">
      <div className="text-xl font-bold text-green-700">Anndhara</div>
      {user && user.role === 'buyer' && (
        <a
          href="/favorites"
          className="flex items-center gap-1 px-3 py-1 rounded-full hover:bg-green-100 transition-all text-red-500 font-semibold"
        >
          <FaHeart className="text-xl" />
          <span className="hidden md:inline">My Favorites</span>
        </a>
      )}
      {/* Notification bell for both buyers and farmers */}
      {(user && (user.role === 'buyer' || user.role === 'farmer')) && (
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
                <a href="/notifications" className="text-green-700 font-semibold hover:underline">View All Notifications</a>
              </div>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar; 