import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import socket from './socket';
import axios from 'axios';
import {jwtDecode} from "jwt-decode";

// Add a global axios interceptor to always attach the JWT token
axios.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.token) {
      config.headers['Authorization'] = `Bearer ${user.token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const ChatBox = ({ user, otherUser, orderId, cartItemId, cropId: propCropId }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cropContext, setCropContext] = useState(null);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Utility to check if token is expired
  function isTokenExpired(token) {
    if (!token) return true;
    try {
      const { exp } = jwtDecode(token);
      return Date.now() >= exp * 1000;
    } catch {
      return true;
    }
  }

  // Ensure user._id is always set
  const safeUser = user ? { ...user, _id: user._id || user.id } : null;
  const safeOtherUser = otherUser ? { ...otherUser, _id: otherUser._id || otherUser.id } : null;

  // Use cropId prop directly
  const cropId = propCropId;

  useEffect(() => {
    if (!safeUser || !safeOtherUser || isTokenExpired(safeUser.token)) return;
    if (!cropId) {
      setError('This chat requires a valid cropId. Please access chat from a crop listing.');
      setLoading(false);
      console.warn('ChatBox: cropId is undefined, not fetching messages.');
      return;
    }
    setCropContext({ cropId });
    socket.emit('join', safeUser._id);

    // Fetch chat history
    const fetchMessages = async () => {
      try {
        setLoading(true);
        if (isTokenExpired(safeUser.token)) {
          setError('Your session has expired. Please log in again.');
          return;
        }
        if (!cropId) return; // Guard: don't fetch if cropId is missing
        let url = `https://s85-aman-capstone-anndhara-1-8beh.onrender.com/message/${safeUser._id}/${safeOtherUser._id}`;
        url += `?cropId=${cropId}`;
        const res = await axios.get(url);
        setMessages(res.data.messages || []);
      } catch (err) {
        setError('Could not load chat history. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    if (cropId) fetchMessages();

    // Listen for new messages
    socket.on('receiveMessage', (msg) => {
      if ((msg.sender === safeOtherUser._id && msg.receiver === safeUser._id) ||
          (msg.sender === safeUser._id && msg.receiver === safeOtherUser._id)) {
        if (msg.cropId === cropId) {
          setMessages((prev) => [...prev, msg]);
        }
      }
    });

    // Typing indicator
    socket.on('typing', ({ sender, receiver }) => {
      if (sender === safeOtherUser._id && receiver === safeUser._id) {
        setOtherTyping(true);
        setTimeout(() => setOtherTyping(false), 1500);
      }
    });

    return () => {
      socket.off('receiveMessage');
      socket.off('typing');
    };
  }, [user, otherUser, cropId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, otherTyping]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    if (isTokenExpired(safeUser.token)) {
      setError('Your session has expired. Please log in again.');
      return;
    }
    if (!cropId) {
      setError('This chat requires a valid cropId.');
      return;
    }
    const msg = {
      receiver: safeOtherUser._id,
      content: input.trim(),
      cropId,
      sender: safeUser._id,
      senderRole: safeUser.role, // Include sender role for proper alignment
    };
    try {
      socket.emit('sendMessage', msg);
      setInput('');
    } catch (err) {
      setError('Could not send your message. Please try again.');
    }
  };

  const handleInput = (e) => {
    setInput(e.target.value);
    socket.emit('typing', { sender: safeUser._id, receiver: safeOtherUser._id });
  };

  const handleClearMessages = async () => {
    try {
      const body = {
        userId: safeUser._id,
        otherUserId: safeOtherUser._id,
      };
      if (orderId) body.orderId = orderId;
      else if (cartItemId) body.cartItemId = cartItemId;
      else if (cropContext && cropContext.cropId) body.cropId = cropContext.cropId;
      const res = await fetch('https://s85-aman-capstone-anndhara-1-8beh.onrender.com/message/clear', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setMessages([]);
      }
    } catch (err) {
      setError('Failed to clear messages.');
    }
  };

  if (!safeUser || !safeOtherUser) {
    return <div className="text-center p-4">Please login to chat.</div>;
  }
  if (!cropId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-lg mx-auto bg-white rounded-lg shadow-md p-8 text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Chat Unavailable</h2>
          <p className="text-lg text-gray-700 mb-4">
            This chat requires a valid <span className="font-semibold">cropId</span>.<br />
            Please access chat from a crop listing.
          </p>
          <input
            className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-4 bg-gray-100 cursor-not-allowed"
            placeholder="Type a message..."
            disabled
          />
          <button
            className="bg-green-600 text-white px-4 py-2 rounded-lg mt-2 opacity-50 cursor-not-allowed"
            disabled
          >
            Send
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full bg-white shadow-lg">
        {/* Header */}
        <div className="bg-green-600 text-white p-4 flex items-center justify-between border-b border-green-700 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <span className="text-lg font-bold">
                {safeOtherUser.username?.charAt(0)?.toUpperCase() || '?'}
              </span>
            </div>
            <div>
              <h2 className="text-lg font-semibold">
                {safeOtherUser.username || safeOtherUser.email || 'User'}
              </h2>
              <p className="text-sm opacity-90">
                {safeOtherUser.role === 'farmer' ? '🌾 Farmer' : '🛒 Buyer'}
                {cropContext && ' • 🌱 Crop Chat'}
              </p>
            </div>
          </div>
          <div className="flex gap-3 items-center">
            {(orderId || cartItemId || (cropContext && cropContext.cropId)) && (
              <button
                onClick={handleClearMessages}
                className="bg-red-500 bg-opacity-80 hover:bg-opacity-100 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-1"
              >
                <span>🗑️</span>
                <span>Clear Chat</span>
              </button>
            )}
            <button
              onClick={() => navigate(-1)}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-1"
            >
              <span>←</span>
              <span>Back</span>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50">
          {loading ? (
            <div className="flex items-center justify-center text-gray-500 h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-2"></div>
                <p>Loading messages...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center text-red-600 h-full">
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-4xl mb-2">⚠️</div>
                <p>{error}</p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-gray-500 h-full flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">💬</div>
                <h3 className="text-lg font-semibold mb-2">No messages yet</h3>
                <p className="text-gray-400">Start the conversation!</p>
                {cropContext && (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="text-green-600 text-sm font-medium">
                      🌱 This conversation is about a specific crop
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => {
              // Determine sender role more reliably
              let senderRole = 'buyer'; // default
              
              // First check if message has senderRole property
              if (msg.senderRole) {
                senderRole = msg.senderRole;
              } else {
                // Determine role based on sender ID
                if (msg.sender === safeUser._id) {
                  senderRole = safeUser.role;
                } else if (msg.sender === safeOtherUser._id) {
                  senderRole = safeOtherUser.role;
                }
              }
              
              const isFarmerMessage = senderRole === 'farmer';
              const isMyMessage = msg.sender === safeUser._id;
              
              return (
                <div key={idx} className={`flex mb-3 ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex items-start space-x-2 max-w-xs lg:max-w-md ${isMyMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    {/* Avatar */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                      isFarmerMessage ? 'bg-green-600' : 'bg-blue-600'
                    }`}>
                      {isFarmerMessage ? '🌾' : '🛒'}
                    </div>
                    
                    {/* Message bubble */}
                    <div className="flex flex-col">
                      {/* Sender name - More prominent */}
                      <div className={`text-sm font-semibold mb-2 px-1 ${
                        isMyMessage ? 'text-right text-green-700' : 'text-left text-blue-700'
                      }`}>
                        {isMyMessage ? (
                          <span className="bg-green-100 px-2 py-1 rounded-full text-green-800">
                            You ({safeUser.role === 'farmer' ? '🌾 Farmer' : '🛒 Buyer'})
                          </span>
                        ) : (
                          <span className="bg-blue-100 px-2 py-1 rounded-full text-blue-800">
                            {isFarmerMessage ? 
                              `🌾 ${safeOtherUser.username || 'Farmer'}` : 
                              `🛒 ${safeOtherUser.username || 'Buyer'}`
                            }
                          </span>
                        )}
                      </div>
                      
                      <div className={`px-4 py-2 rounded-2xl shadow-sm ${
                        isMyMessage 
                          ? 'bg-green-500 text-white rounded-br-md' 
                          : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md'
                      }`}>
                        <p className="text-sm leading-relaxed break-words">{msg.content}</p>
                        
                        {/* Timestamp and status */}
                        <div className={`flex items-center justify-end mt-1 space-x-1 ${
                          isMyMessage ? 'text-green-100' : 'text-gray-400'
                        }`}>
                          <span className="text-xs">
                            {new Date(msg.timestamp || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                          {isMyMessage && (
                            <span className="text-xs">✓✓</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          {otherTyping && (
            <div className="flex justify-start mb-2">
              <div className="bg-white text-gray-600 px-4 py-2 rounded-2xl rounded-bl-md border border-gray-200 shadow-sm">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                  <span className="text-xs">typing...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="flex-1">
              <input
                value={input}
                onChange={handleInput}
                placeholder="Type a message..."
                className="w-full bg-gray-100 rounded-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all duration-200 text-sm"
                disabled={!cropId}
              />
              {!cropId && (
                <p className="text-xs text-red-500 mt-1">⚠️ Crop context required for messaging</p>
              )}
            </div>
            <button
              type='submit'
              disabled={!input.trim() || !cropId}
              className="bg-green-500 text-white p-3 rounded-full hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
            >
              <span className="text-lg">➤</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatBox; 