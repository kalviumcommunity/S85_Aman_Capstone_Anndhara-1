import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../store/authStore';

const ROLE_OPTIONS = [
  { value: 'buyer', label: 'Buyer' },
  { value: 'farmer', label: 'Farmer' },
];

const Profile = () => {
  const { user, updateUser } = useUser();
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ username: '', email: '', phone: '', role: '' });
  const [message, setMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !user.token) {
      setCurrentUser(null);
      return;
    }
    fetch('https://s85-aman-capstone-anndhara-1-8beh.onrender.com/user/me', {
      headers: { Authorization: `Bearer ${user.token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setCurrentUser(data.data);
          setForm({
            username: data.data.username || '',
            email: data.data.email || '',
            phone: data.data.phone || '',
            role: data.data.role || '',
          });
        } else {
          setCurrentUser(user);
        }
      })
      .catch(() => setCurrentUser(user));
  }, [user]);

  if (!currentUser) {
    return <div className="p-4 text-center">No user logged in. Please login first.</div>;
  }

  const logout = () => {
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const getInitials = (name) => {
    if (!name) return '👤';
    const parts = name.split(' ');
    return parts.length > 1
      ? parts[0][0].toUpperCase() + parts[1][0].toUpperCase()
      : parts[0][0].toUpperCase();
  };

  const handleEdit = () => setEditMode(true);
  const handleCancel = () => {
    setEditMode(false);
    setForm({
      username: currentUser.username || '',
      email: currentUser.email || '',
      phone: currentUser.phone || '',
      role: currentUser.role || '',
    });
    setMessage('');
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setMessage('');
    const userData = JSON.parse(localStorage.getItem('user'));
    try {
      const res = await fetch(`https://s85-aman-capstone-anndhara-1-8beh.onrender.com/user/update/${currentUser._id || currentUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userData.token}`
        },
        body: JSON.stringify({
          username: form.username,
          email: form.email,
          phone: form.phone,
          role: form.role,
        })
      });
      const data = await res.json();
      if (data.success) {
        setCurrentUser(data.data);
        setEditMode(false);
        setMessage('Profile updated successfully!');
        
        // Update localStorage with new user data
        const updatedUserData = {
          ...userData,
          username: data.data.username,
          email: data.data.email,
          phone: data.data.phone,
          role: data.data.role,
        };
        localStorage.setItem('user', JSON.stringify(updatedUserData));
        
        // Update the global user context
        updateUser(updatedUserData);
        
        // If role changed, show message and refresh after delay
        if (currentUser.role !== data.data.role) {
          setMessage('Profile updated successfully! Role changed. UI will update shortly...');
          
          // Update the global user context immediately
          updateUser(updatedUserData);
          
          // Refresh the page after a short delay to update all components
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        }
      } else {
        setMessage(data.message || 'Failed to update profile.');
      }
    } catch (err) {
      setMessage('Server error. Please try again.');
    }
  };

  // Show loading state while fetching user data
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center px-4 py-10">
        <div className="bg-white shadow-2xl rounded-xl max-w-md w-full p-8 border-0">
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-green-100 to-blue-100 flex items-center justify-center mb-4 animate-pulse">
              <div className="w-12 h-12 bg-green-200 rounded-full"></div>
            </div>
            <div className="h-6 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
            <div className="mt-6 space-y-3 w-full">
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center px-4 py-10">
      <div className="bg-white shadow-2xl rounded-xl max-w-md w-full p-8 border-0 transform transition-all duration-300 hover:shadow-3xl">
        {/* Welcome Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome to FarmConnect</h1>
          <p className="text-gray-600">Manage your profile and account settings</p>
        </div>
        
        {/* Profile Avatar and Info */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center text-4xl font-bold text-white mb-3 shadow-lg transform transition-transform hover:scale-105">
            {getInitials(currentUser.username || currentUser.name)}
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-1 text-center">{currentUser.username || currentUser.name}</h2>
          <span className="text-gray-500 text-sm bg-gray-100 px-3 py-1 rounded-full">{currentUser.email}</span>
        </div>
        {editMode ? (
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Username:</label>
              <input 
                type="text" 
                name="username" 
                value={form.username} 
                onChange={handleChange} 
                className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-green-500 transition-colors" 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email:</label>
              <input 
                type="email" 
                name="email" 
                value={form.email} 
                onChange={handleChange} 
                className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-green-500 transition-colors" 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Phone:</label>
              <input 
                type="text" 
                name="phone" 
                value={form.phone} 
                onChange={handleChange} 
                className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-green-500 transition-colors" 
                placeholder="Enter your phone number"
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Role:</label>
              <select 
                name="role" 
                value={form.role} 
                onChange={handleChange} 
                className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-green-500 transition-colors bg-white" 
                required
              >
                <option value="">Select Your Role</option>
                {ROLE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            {message && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg">
                {message}
              </div>
            )}
            <div className="flex gap-3 mt-6">
              <button 
                type="submit" 
                className="flex-1 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg font-semibold shadow-lg transform transition-all duration-200 hover:scale-105"
              >
                Save Changes
              </button>
              <button 
                type="button" 
                onClick={handleCancel} 
                className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            {/* Profile Information Cards */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-600">Username</span>
                <span className="text-gray-800 font-medium">{currentUser.username}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-600">Email</span>
                <span className="text-gray-800 font-medium">{currentUser.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-600">Role</span>
                <span className={currentUser.role ? "text-gray-800 font-medium" : "text-yellow-600 font-semibold"}>
                  {currentUser.role || "Not Set"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-600">Phone</span>
                <span className={currentUser.phone ? "text-gray-800 font-medium" : "text-yellow-600 font-semibold"}>
                  {currentUser.phone || "Not Set"}
                </span>
              </div>
            </div>

            {message && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg">
                {message}
              </div>
            )}
            
            {!currentUser.role && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mr-2">
                    <span className="text-white text-sm font-bold">!</span>
                  </div>
                  <h3 className="text-blue-700 font-bold text-lg">Complete Your Profile</h3>
                </div>
                <p className="text-blue-600 text-sm">You need to set your role (Farmer or Buyer) to fully use the application. Click "Edit Profile" below to complete your profile setup.</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3 mt-6">
              <button 
                onClick={handleEdit} 
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-semibold shadow-lg transform transition-all duration-200 hover:scale-105"
              >
                Edit Profile
              </button>
              
              {/* View My Orders button for buyers */}
              {currentUser.role === 'buyer' && (
                <button
                  className="w-full py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg font-semibold shadow-lg transform transition-all duration-200 hover:scale-105"
                  onClick={() => navigate('/buyer-orders')}
                >
                  📦 View My Orders
                </button>
              )}
            </div>
          </div>
        )}
        
        {/* Logout Button */}
        <button
          onClick={logout}
          className="mt-8 w-full py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg font-semibold shadow-lg transform transition-all duration-200 hover:scale-105"
        >
          🚪 Logout
        </button>
      </div>
    </div>
  );
};

export default Profile;
