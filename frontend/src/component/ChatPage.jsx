import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import ChatBox from './ChatBox';

const ChatPage = () => {
  const { otherUserId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // Extract orderId and cartItemId from query string
  const query = new URLSearchParams(location.search);
  const orderId = query.get('orderId');
  const cartItemId = query.get('cartItemId');
  const cropId = query.get('cropId');

  useEffect(() => {
    // Load current user from localStorage
    const rawUser = JSON.parse(localStorage.getItem('user'));
    if (!rawUser) {
      setError('Please login to chat.');
      setLoading(false);
      return;
    }
    setUser({ ...rawUser, _id: rawUser._id || rawUser.id });

    // Fetch other user info
    fetch(`http://localhost:9001/user?id=${otherUserId}`)
      .then(res => res.json())
      .then(data => {
        // Try both data.data and data.farmer for compatibility
        const found = (data.data && Array.isArray(data.data)) ? data.data.find(u => u._id === otherUserId) : null;
        const fallback = (data.farmer && Array.isArray(data.farmer)) ? data.farmer.find(u => u._id === otherUserId) : null;
        setOtherUser(found || fallback || { _id: otherUserId });
        setLoading(false);
      })
      .catch(() => {
        setError('Could not load user info.');
        setLoading(false);
      });
  }, [otherUserId]);

  if (loading) return <div className="p-8 text-green-700">Loading chat...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!user || !otherUser) return <div className="p-8 text-red-600">User info missing.</div>;

  return <ChatBox user={user} otherUser={otherUser} orderId={orderId} cartItemId={cartItemId} cropId={cropId} />;
};

export default ChatPage; 