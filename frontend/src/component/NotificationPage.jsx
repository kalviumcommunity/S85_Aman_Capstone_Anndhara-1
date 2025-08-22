import React, { useEffect, useState } from 'react';
import { FaBell, FaCheck, FaClock, FaExclamationTriangle } from 'react-icons/fa';

const NotificationPage = ({ setNotifications: setGlobalNotifications }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    if (!user || !user.token) {
      setError('Please log in to view notifications.');
      setLoading(false);
      return;
    }
    fetch('https://s85-aman-capstone-anndhara-1-8beh.onrender.com/notification', {
      headers: { Authorization: `Bearer ${user.token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.notifications)) {
          setNotifications(data.notifications);
        } else {
          setError('Failed to fetch notifications.');
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to fetch notifications.');
        setLoading(false);
      });
  }, [user]);

  const handleMarkAsRead = async (notif, idx) => {
    if (notif.read) return;
    try {
      await fetch(`https://s85-aman-capstone-anndhara-1-8beh.onrender.com/notification/${notif._id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${user.token}` }
      });
      const updated = [...notifications];
      updated[idx].read = true;
      setNotifications(updated);
      if (setGlobalNotifications) {
        setGlobalNotifications(prev => {
          const copy = prev.map(n => n._id === notif._id ? { ...n, read: true } : n);
          return copy;
        });
      }
    } catch {
      // Optionally show error
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center animate-pulse">
            <FaBell className="text-2xl text-white" />
          </div>
          <p className="text-green-700 font-medium">Loading notifications...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center">
            <FaExclamationTriangle className="text-2xl text-white" />
          </div>
          <h3 className="text-xl font-semibold text-red-700 mb-2">Error Loading Notifications</h3>
          <p className="text-red-600">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const getNotificationIcon = (message) => {
    if (message.toLowerCase().includes('order')) return { icon: '📦', color: 'from-blue-500 to-blue-600', bg: 'from-blue-50 to-blue-100' };
    if (message.toLowerCase().includes('message')) return { icon: '💬', color: 'from-purple-500 to-purple-600', bg: 'from-purple-50 to-purple-100' };
    if (message.toLowerCase().includes('crop') || message.toLowerCase().includes('upload')) return { icon: '🌱', color: 'from-green-500 to-green-600', bg: 'from-green-50 to-green-100' };
    if (message.toLowerCase().includes('payment')) return { icon: '💰', color: 'from-yellow-500 to-yellow-600', bg: 'from-yellow-50 to-yellow-100' };
    if (message.toLowerCase().includes('error') || message.toLowerCase().includes('failed')) return { icon: '⚠️', color: 'from-red-500 to-red-600', bg: 'from-red-50 to-red-100' };
    return { icon: '🔔', color: 'from-gray-500 to-gray-600', bg: 'from-gray-50 to-gray-100' };
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const readCount = notifications.filter(n => n.read).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl text-white shadow-lg">
                  <FaBell className="text-xl" />
                </div>
                Notifications
              </h1>
              <p className="mt-2 text-gray-600">Stay updated with your latest activities</p>
            </div>
            
            {/* Stats */}
            <div className="flex gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{unreadCount}</div>
                <div className="text-sm text-gray-500">Unread</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">{readCount}</div>
                <div className="text-sm text-gray-500">Read</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {notifications.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
              <FaBell className="text-3xl text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No notifications yet</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              When you receive notifications about orders, messages, or other activities, they'll appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Mark all as read button */}
            {unreadCount > 0 && (
              <div className="flex justify-end mb-6">
                <button
                  onClick={() => {
                    notifications.forEach((notif, idx) => {
                      if (!notif.read) handleMarkAsRead(notif, idx);
                    });
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 shadow-sm"
                >
                  <FaCheck className="text-sm" />
                  Mark all as read
                </button>
              </div>
            )}

            {/* Notifications Grid */}
            <div className="grid gap-4">
              {notifications.map((notif, idx) => {
                const iconData = getNotificationIcon(notif.message);
                return (
                  <div
                    key={notif._id || idx}
                    className={`group relative bg-white rounded-xl border transition-all duration-300 hover:shadow-lg cursor-pointer overflow-hidden ${
                      notif.read 
                        ? 'border-gray-200 hover:border-gray-300' 
                        : 'border-green-200 shadow-sm hover:border-green-300 ring-1 ring-green-100'
                    }`}
                    onClick={() => handleMarkAsRead(notif, idx)}
                  >
                    {/* Unread indicator */}
                    {!notif.read && (
                      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-green-500 to-green-600" />
                    )}
                    
                    <div className="p-6">
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${iconData.bg} flex items-center justify-center text-xl shadow-sm`}>
                          {iconData.icon}
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <p className={`font-medium leading-6 ${
                                notif.read ? 'text-gray-700' : 'text-gray-900'
                              }`}>
                                {notif.message}
                              </p>
                              
                              <div className="flex items-center gap-4 mt-3">
                                <div className="flex items-center gap-1 text-sm text-gray-500">
                                  <FaClock className="text-xs" />
                                  {new Date(notif.createdAt).toLocaleString('en-US', {
                                    weekday: 'short',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </div>
                                
                                {!notif.read && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-200">
                                    New
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {/* Status indicator */}
                            <div className={`flex-shrink-0 w-3 h-3 rounded-full ${
                              notif.read ? 'bg-gray-300' : 'bg-green-500 animate-pulse'
                            }`} />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Hover effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationPage;