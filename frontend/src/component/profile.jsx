import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ROLE_OPTIONS = [
  { value: 'buyer', label: 'Buyer' },
  { value: 'farmer', label: 'Farmer' },
];

const Profile = () => {
  const [user, setUser] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', role: '' });
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    if (!userData || !userData.token) {
      setUser(null);
      return;
    }
    fetch('http://localhost:9001/user/me', {
      headers: { Authorization: `Bearer ${userData.token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setUser(data.data);
          setForm({
            name: data.data.username || data.data.name || '',
            email: data.data.email || '',
            phone: data.data.phone || '',
            role: data.data.role || '',
          });
        } else {
          setUser(userData);
        }
      })
      .catch(() => setUser(userData));
  }, []);

  if (!user) {
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
      name: user.username || user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      role: user.role || '',
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
      const res = await fetch(`http://localhost:9001/user/update/${user._id || user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userData.token}`
        },
        body: JSON.stringify({
          user: form.name,
          email: form.email,
          phone: form.phone,
          role: form.role,
        })
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.data);
        setEditMode(false);
        setMessage('Profile updated successfully!');
      } else {
        setMessage(data.message || 'Failed to update profile.');
      }
    } catch (err) {
      setMessage('Server error. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center px-4 py-10 animate-fade-in">
      <div className="bg-white shadow-xl rounded-lg max-w-md w-full p-6 border">
        <div className="flex flex-col items-center mb-4">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center text-4xl font-bold text-green-700 mb-2 border-2 border-green-400">
            {getInitials(user.username || user.name)}
          </div>
          <h2 className="text-2xl font-bold text-green-700 mb-1 text-center">{user.username || user.name}</h2>
          <span className="text-gray-500 text-sm">{user.email}</span>
        </div>
        {editMode ? (
          <form onSubmit={handleSave} className="space-y-3 text-gray-700 mt-4">
            <div>
              <label className="block font-semibold mb-1">Name:</label>
              <input type="text" name="name" value={form.name} onChange={handleChange} className="w-full border rounded px-3 py-2" required />
            </div>
            <div>
              <label className="block font-semibold mb-1">Email:</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} className="w-full border rounded px-3 py-2" required />
            </div>
            <div>
              <label className="block font-semibold mb-1">Phone:</label>
              <input type="text" name="phone" value={form.phone} onChange={handleChange} className="w-full border rounded px-3 py-2" required />
            </div>
            <div>
              <label className="block font-semibold mb-1">Role:</label>
              <select name="role" value={form.role} onChange={handleChange} className="w-full border rounded px-3 py-2" required>
                <option value="">Select Role</option>
                {ROLE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            {message && <div className="text-green-700 font-semibold">{message}</div>}
            <div className="flex gap-2 mt-4">
              <button type="submit" className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-semibold">Save</button>
              <button type="button" onClick={handleCancel} className="flex-1 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded font-semibold">Cancel</button>
            </div>
          </form>
        ) : (
          <div className="space-y-3 text-gray-700 mt-4">
            <div><strong>Name:</strong> {user.username || user.name}</div>
            <div><strong>Email:</strong> {user.email}</div>
            <div><strong>Role:</strong> {user.role}</div>
            <div><strong>Phone:</strong> {user.phone}</div>
            {message && <div className="text-green-700 font-semibold">{message}</div>}
            <button onClick={handleEdit} className="mt-4 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold">Edit Profile</button>
            {/* View My Orders button for buyers */}
            {user.role === 'buyer' && (
              <button
                className="mt-2 w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded font-semibold"
                onClick={() => navigate('/buyer-orders')}
              >
                View My Orders
              </button>
            )}
          </div>
        )}
        <button
          onClick={logout}
          className="mt-6 w-full py-2 bg-red-500 hover:bg-red-600 text-white rounded font-semibold transition-all duration-200"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Profile;
