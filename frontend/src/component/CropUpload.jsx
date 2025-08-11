import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import{useNavigate}from 'react-router-dom';
import { Upload, Image, MapPin, Leaf, Package, Tag } from 'lucide-react';

const CropUpload = () => {
  const navigate=useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    pricePerKg: '',
    quantityKg: '',
    location: '',
  });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');
  const [user, setUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    const token = user?.token;
    if (token) {
      // Fetch latest user data from server to ensure we have current role
      fetch('https://s85-aman-capstone-anndhara-1-8beh.onrender.com/user/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          const userData = data.data;
          if (import.meta.env.MODE === 'development') console.log('Latest user data:', userData);
          
          // Since this component is protected by FarmerRoute, user should be a farmer
          if (userData.role === 'farmer') {
            setStatus('success');
            setMessage('');
            setUser(userData);
          } else {
            // This shouldn't happen due to route protection, but handle gracefully
            setStatus('error');
            setMessage('❌ Access denied. Only farmers can upload crops.');
          }
        } else {
          setStatus('error');
          setMessage('❌ Failed to fetch user data. Please try again.');
        }
      })
      .catch(err => {
        console.error('Error fetching user data:', err);
        setStatus('error');
        setMessage('❌ Error fetching user data. Please try again.');
      });
    } else {
      setStatus('error');
      setMessage('❌ Please login first.');
    }
  }, []);

  // Listen for role changes in localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      const user = JSON.parse(localStorage.getItem('user'));
      if (user?.token) {
        // Fetch latest user data from server
        fetch('https://s85-aman-capstone-anndhara-1-8beh.onrender.com/user/me', {
          headers: { Authorization: `Bearer ${user.token}` }
        })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data) {
            const userData = data.data;
            if (userData.role === 'farmer') {
              setStatus('success');
              setMessage('');
              setUser(userData);
            } else {
              // If user is no longer a farmer, redirect them
              window.location.href = '/';
            }
          }
        })
        .catch(err => {
          console.error('Error fetching user data:', err);
        });
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setStatus('error');
        setMessage('❌ Please select only image files.');
        return;
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setStatus('error');
        setMessage('❌ File size too large. Maximum size is 5MB.');
        return;
      }
      
      setImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
      
      // Clear any previous error messages
      if (status === 'error') {
        setStatus('');
        setMessage('');
      }
    } else {
      setImage(null);
      setImagePreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSubmitting) return; // Prevent double submission
    
    const user = JSON.parse(localStorage.getItem('user'));
    const token = user?.token;
    if (!token || isTokenExpired(token)) {
      setStatus('error');
      setMessage('❌ Please login again.');
      return;
    }

    // Validate form data
    if (!formData.name.trim() || !formData.type || !formData.pricePerKg || !formData.quantityKg || !formData.location.trim()) {
      setStatus('error');
      setMessage('❌ Please fill in all required fields.');
      return;
    }

    if (parseFloat(formData.pricePerKg) <= 0 || parseFloat(formData.quantityKg) <= 0) {
      setStatus('error');
      setMessage('❌ Price and quantity must be greater than 0.');
      return;
    }

    setIsSubmitting(true);
    setStatus('');
    setMessage('⏳ Uploading crop...');

    const formDataToSend = new FormData();
    formDataToSend.append('name', formData.name.trim());
    formDataToSend.append('type', formData.type);
    formDataToSend.append('pricePerKg', formData.pricePerKg);
    formDataToSend.append('quantityKg', formData.quantityKg);
    formDataToSend.append('location', formData.location.trim());
    if (image) {
      formDataToSend.append('image', image);
    }

    try {
      const response = await axios.post('https://s85-aman-capstone-anndhara-1-8beh.onrender.com/crop/crop', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setStatus('success');
        setMessage('✅ Crop uploaded successfully!');
        setFormData({
          name: '',
          type: '',
          pricePerKg: '',
          quantityKg: '',
          location: '',
        });
        setImage(null);
        setImagePreview(null);
        
        // Redirect to home page after successful upload
        setTimeout(() => {
          navigate('/');
        }, 1500);
      } else {
        setStatus('error');
        setMessage(response.data.message || '❌ Failed to upload crop.');
      }
    } catch (error) {
      console.error('Upload error:', error);
      if (error.response?.status === 401) {
        setStatus('error');
        setMessage('❌ Please login again.');
      } else if (error.response?.status === 403) {
        const errorData = error.response.data;
        if (errorData.requiresRoleSetup) {
          setStatus('error');
          setMessage('❌ Please set your role to "farmer" in your profile settings to upload crops. Go to Profile → Edit Profile → Select "Farmer" role.');
        } else {
          setStatus('error');
          setMessage(errorData.message || '❌ Access denied. Only farmers can upload crops.');
        }
      } else if (error.response?.status === 400) {
        setStatus('error');
        setMessage(error.response.data.message || '❌ Invalid data provided.');
      } else {
        setStatus('error');
        setMessage('❌ Failed to upload crop. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 to-white py-10 px-4">
      <div className="max-w-lg mx-auto bg-white p-8 rounded-2xl shadow-xl">
        <h2 className="text-3xl font-bold text-green-700 mb-6 text-center">🌾 Upload New Crop</h2>

        {user && (
          <div className="text-center mb-4">
            <p className="text-sm text-green-600 mb-2">
              Logged in as: <strong>{user.username || user.email || user.name}</strong>
            </p>
            {(!user.role || user.role === '') && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-sm">
                <p className="text-yellow-700 font-semibold">⚠️ Role Not Set</p>
                <p className="text-yellow-600">You need to set your role to "farmer" in your profile settings to upload crops.</p>
                <button 
                  onClick={() => navigate('/profile')}
                  className="mt-2 text-blue-600 hover:text-blue-800 underline text-sm"
                >
                  Go to Profile Settings →
                </button>
              </div>
            )}
          </div>
        )}

        {message && (
          <div className={`mb-4 px-4 py-3 rounded-md text-sm font-semibold ${status === 'success'
              ? 'bg-green-100 text-green-700 border border-green-300'
              : 'bg-red-100 text-red-700 border border-red-300'
            }`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" encType="multipart/form-data">
          <Field icon={<Leaf size={18} />} name="name" value={formData.name} onChange={handleChange} placeholder="Crop Name" />
          <div className="flex items-center gap-2">
            <Tag size={18} />
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-green-400 outline-none"
            >
              <option value="" disabled>
                Select Crop Type
              </option>
              <option value="vegetable">Vegetable</option>
              <option value="fruit">Fruit</option>
              <option value="grain">Grain</option>
              <option value="spice">Spice</option>
              <option value="herb">Herb</option>
              <option value="other">Other</option>

            </select>
          </div>
          <Field icon={<Package size={18} />} type="number" name="pricePerKg" value={formData.pricePerKg} onChange={handleChange} placeholder="Price per Kg" />
          <Field icon={<Package size={18} />} type="number" name="quantityKg" value={formData.quantityKg} onChange={handleChange} placeholder="Quantity (Kg)" />
          <Field icon={<MapPin size={18} />} name="location" value={formData.location} onChange={handleChange} placeholder="Location" />

          <div className="flex items-center gap-2">
            <Image size={18} className="text-gray-500" />
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full border border-gray-300 rounded-md px-4 py-2 file:bg-green-600 file:text-white file:border-0 file:px-4 file:py-2 file:rounded-md"
            />
          </div>

          {imagePreview && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">Image Preview:</p>
              <div className="relative w-full h-48 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImage(null);
                    setImagePreview(null);
                  }}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full font-semibold py-3 rounded-lg transition duration-200 flex justify-center items-center gap-2 ${
              isSubmitting 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            <Upload size={18} />
            {isSubmitting ? 'Uploading...' : 'Upload Crop'}
          </button>
        </form>
      </div>
    </div>
  );
};

const Field = ({ icon, name, value, onChange, placeholder, type = 'text', disabled = false }) => (
  <div className="flex items-center gap-2">
    {icon}
    <input
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-green-400 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
    />
  </div>
);

export default CropUpload;

