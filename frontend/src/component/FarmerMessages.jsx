import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { io } from 'socket.io-client';
const socket = io('http://localhost:9001');

const getInitials = (name, email) => {
  if (name) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }
  if (email) {
    return email[0].toUpperCase();
  }
  return '?';
};

const FarmerMessages = () => {
  const [user, setUser] = useState(null);
  const [buyers, setBuyers] = useState([]);
  const [filteredBuyers, setFilteredBuyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [unreadCounts, setUnreadCounts] = useState({});
  const navigate = useNavigate();

  // Utility to check if token is expired
  function isTokenExpired(token) {
    if (!token) return true;
    try {
      const { exp } = jwtDecode(token);
      const isExpired = Date.now() >= exp * 1000;
      console.log('Token expiration check:', {
        tokenExp: exp,
        currentTime: Date.now(),
        expTime: exp * 1000,
        isExpired
      });
      return isExpired;
    } catch (error) {
      console.log('Token decode error:', error);
      return true;
    }
  }

  // Parse user from localStorage once on component mount
  useEffect(() => {
    console.log('Parsing user from localStorage...');
    try {
      const userDataString = localStorage.getItem('user');
      console.log('Raw localStorage data:', userDataString);
      
      if (!userDataString) {
        console.log('No user data in localStorage');
        setUser(null);
        return;
      }

      const userData = JSON.parse(userDataString);
      console.log('Parsed user data:', userData);
      
      if (userData && userData.token && isTokenExpired(userData.token)) {
        console.log('Token is expired, removing user from localStorage');
        localStorage.removeItem('user');
        setUser(null);
      } else {
        const processedUser = userData ? { ...userData, _id: userData._id || userData.id } : null;
        console.log('Setting user:', processedUser);
        setUser(processedUser);
      }
    } catch (e) {
      console.error('Error parsing user data:', e);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    console.log('=== User validation useEffect ===');
    console.log('User object:', user);
    console.log('User ID:', user?.id);
    console.log('User token exists:', !!user?.token);
    console.log('User role:', user?.role);
    
    if (user?.token) {
      console.log('Token expired:', isTokenExpired(user.token));
    }

    if (!user || !user.id || !user.token || isTokenExpired(user.token)) {
      console.log('User validation failed - setting error');
      setError("Please log in again. Your session has expired.");
      setLoading(false);
      return;
    }

    console.log('User validation passed - fetching buyers');

    const fetchBuyers = async () => {
      try {
        setLoading(true);
        setError(""); // Clear any previous errors
        const userId = user.id;
        console.log('Fetching buyers for user ID:', userId);
        
        const response = await axios.get(`http://localhost:9001/message/buyers/${userId}`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        
        console.log('Buyers response:', response.data);
        setBuyers(response.data.buyers || []);
        setFilteredBuyers(response.data.buyers || []);
        
        // Fetch unread counts
        console.log('Fetching unread counts...');
        const unreadRes = await axios.get(`http://localhost:9001/message/unread-counts/${userId}`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        
        console.log('Unread counts response:', unreadRes.data);
        setUnreadCounts(unreadRes.data.unreadCounts || {});
      } catch (err) {
        console.error('Error fetching buyers:', err);
        
        if (err.response && err.response.status === 404) {
          setError("No buyers have messaged you yet. When buyers view your crops and click 'Message Farmer', they will appear here.");
        } else if (err.response && err.response.status === 403) {
          setError("Access denied: Unauthorized");
        } else if (err.response && err.response.data && err.response.data.error) {
          setError(err.response.data.error);
        } else {
          setError("Could not load buyers. Please try again in a few moments.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBuyers();
  }, [user?.id, user?.token]);

  // Search/filter buyers
  useEffect(() => {
    if (!search) {
      setFilteredBuyers(buyers);
    } else {
      setFilteredBuyers(
        buyers.filter(buyer =>
          (buyer.username && buyer.username.toLowerCase().includes(search.toLowerCase())) ||
          (buyer.email && buyer.email.toLowerCase().includes(search.toLowerCase()))
        )
      );
    }
  }, [search, buyers]);

  const handleChatClick = (buyerId, cropId) => {
    if (!cropId) {
      alert('This chat requires a valid cropId.');
      return;
    }
    navigate(`/chat/${buyerId}?cropId=${cropId}`);
  };

  // Add a logout function for testing
  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  if (!user || user.role !== 'farmer') {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-gray-600">This page is only for farmers.</p>
          <button
            onClick={() => navigate('/login')}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-green-700">Messages</h1>
              <p className="text-gray-600 mt-2">Buyers who have messaged you about your crops</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => navigate('/')} 
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                ← Back to Dashboard
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
          {/* Search bar */}
          <div className="mt-6">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search buyers by name or email..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        {/* Debug Info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h3 className="font-bold text-yellow-800 mb-2">Debug Info:</h3>
            <div className="text-sm text-yellow-700">
              <p>User exists: {user ? 'Yes' : 'No'}</p>
              <p>User ID: {user?.id || 'N/A'}</p>
              <p>Has token: {user?.token ? 'Yes' : 'No'}</p>
              <p>Token expired: {user?.token ? (isTokenExpired(user.token) ? 'Yes' : 'No') : 'N/A'}</p>
              <p>User role: {user?.role || 'N/A'}</p>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <div className="flex items-center justify-center text-gray-600 mt-4">Loading buyers...</div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-red-600 text-lg mb-2">⚠️</div>
              <div className="text-red-600 mb-4">
                {error}
              </div>
              {error.includes("session has expired") && (
                <button
                  onClick={() => navigate('/login')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Go to Login
                </button>
              )}
            </div>
          ) : filteredBuyers.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-6xl mb-4">💬</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Messages Yet</h3>
              <p className="text-gray-600 mb-4">
                When buyers message you about your crops, they will appear here.
              </p>
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Buyers ({filteredBuyers.length})
              </h2>
              <div className="space-y-6">
                {filteredBuyers.map((buyer, idx) => (
                  <div key={buyer._id} className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center gap-4 mb-2">
                      <div className="w-12 h-12 rounded-full bg-green-200 flex items-center justify-center text-2xl font-bold text-green-700">
                        {getInitials(buyer.username, buyer.email)}
                      </div>
                      <div>
                        <div className="font-bold text-lg">{buyer.username}</div>
                        <div className="text-sm text-gray-600 flex items-center gap-2">
                          <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-semibold">Buyer</span>
                          <span>• {buyer.email}</span>
                          {buyer.phone && <span>• {buyer.phone}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="font-semibold text-gray-700 mb-1">Conversations:</div>
                      <div className="space-y-3">
                        {buyer.conversations.map((conv, cidx) => (
                          <div key={conv.cropId || cidx} className="bg-gray-50 rounded p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {conv.cropImageUrl && (
                                <img src={conv.cropImageUrl} alt={conv.cropName} className="w-10 h-10 object-cover rounded" />
                              )}
                              <div>
                                <div className="font-bold text-green-700 text-base flex items-center gap-2">
                                  {conv.cropName}
                                  {conv.cropType && (
                                    <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-semibold">{conv.cropType}</span>
                                  )}
                                </div>
                                <div className="text-xs text-gray-500">Last message: <span className="text-gray-700">{conv.lastMessage}</span></div>
                                <div className="text-xs text-gray-400">{new Date(conv.lastMessageTime).toLocaleString()}</div>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <div className="text-sm text-gray-600">{conv.messageCount} messages</div>
                              <button
                                className={`bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700 text-xs font-semibold ${!conv.cropId ? 'opacity-50 cursor-not-allowed' : ''}`}
                                onClick={() => handleChatClick(buyer._id, conv.cropId)}
                                disabled={!conv.cropId}
                                title={!conv.cropId ? 'No crop context for this chat' : ''}
                              >
                                Chat
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FarmerMessages;