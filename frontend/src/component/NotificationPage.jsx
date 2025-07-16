import React, { useEffect, useState } from 'react';

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
    fetch('http://localhost:9001/notification', {
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
      await fetch(`http://localhost:9001/notification/${notif._id}/read`, {
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

  if (loading) return <div className="p-8 text-green-700">Loading notifications...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;

  return (
    <div className="min-h-screen bg-white p-6">
      <h2 className="text-2xl font-bold mb-4 text-green-700">Notifications</h2>
      {notifications.length === 0 ? (
        <p className="text-gray-500">No notifications found.</p>
      ) : (
        <div className="max-w-2xl mx-auto">
          {notifications.map((notif, idx) => (
            <div
              key={notif._id || idx}
              className={`mb-4 p-4 rounded shadow border cursor-pointer ${notif.read ? 'bg-gray-100 opacity-70' : 'bg-green-50'}`}
              onClick={() => handleMarkAsRead(notif, idx)}
            >
              <div className="font-medium text-gray-800">{notif.message}</div>
              <div className="text-xs text-gray-500 mt-1">{new Date(notif.createdAt).toLocaleString()}</div>
              {!notif.read && (
                <span className="inline-block mt-2 px-2 py-0.5 text-xs bg-green-600 text-white rounded">New</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationPage; 