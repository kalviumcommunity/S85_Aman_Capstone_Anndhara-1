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
        let url = `http://localhost:9001/message/${safeUser._id}/${safeOtherUser._id}`;
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
    };
    try {
      socket.emit('sendMessage', { ...msg, sender: safeUser._id });
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
      const res = await fetch('http://localhost:9001/message/clear', {
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
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md">
        {/* Header */}
        <div className="bg-green-600 text-white p-4 rounded-t-lg flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">
              Chat with {safeOtherUser.username || safeOtherUser.email || 'User'}
            </h2>
            <p className="text-sm opacity-90">
              {safeOtherUser.role === 'farmer' ? 'Farmer' : 'Buyer'}
              {orderId && (
                <span className="ml-2">• About Order</span>
              )}
            </p>
          </div>
          <div className="flex gap-2 items-center">
            {(orderId || cartItemId || (cropContext && cropContext.cropId)) && (
              <button
                onClick={handleClearMessages}
                className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 text-xs font-semibold"
              >
                Clear All Messages
              </button>
            )}
            <button
              onClick={() => navigate(-1)}
              className="text-white hover:text-gray-200"
            >
              ← Back
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="h-96 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center text-gray-500">Loading messages...</div>
          ) : error ? (
            <div className="flex items-center justify-center text-red-600">{error}</div>
          ) : messages.length === 0 ? (
            <div className="text-center text-gray-500">
              No messages yet. Start the conversation!
              {cropContext && (
                <div className="text-sm mt-2">
                  This conversation is about a specific crop.
                </div>
              )}
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.sender === safeUser._id ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    msg.sender === safeUser._id
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-800'
                  }`}
                >
                  {msg.content}
                  {msg.cropId && (
                    <div className="text-xs opacity-75 mt-1">
                      📦 About crop
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          {otherTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg">
                Typing...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="p-4 border-t">
          <div className="flex space-x-2">
            <input
              value={input}
              onChange={handleInput}
              placeholder="Type a message..."
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              disabled={!cropId}
            />
            <button
              type='submit'
              disabled={!input.trim() || !cropId}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatBox; 