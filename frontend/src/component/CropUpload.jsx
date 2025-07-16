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
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    const token = user?.token;
    if (token) {
      try {
        const decoded = jwtDecode(token);
        if (import.meta.env.MODE === 'development') console.log(decoded);
        if (decoded.role !== 'farmer') {
          setStatus('error');
          setMessage('Only farmer can upload crop. ')
        }
        setUser(decoded);
      } catch (e) {
        console.error("Invalid token");
        localStorage.removeItem("token");
      }
    }
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
    setImage(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const user = JSON.parse(localStorage.getItem('user'));
    const token = user?.token;
    if (!token || isTokenExpired(token)) {
      setStatus('error');
      setMessage('❌ Please login to upload crops.');
      localStorage.removeItem('user');
      setUser(null);
      return;
    }


    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      data.append(key, value);
    });
    if (image) data.append('image', image);

    try {
      const res = await axios.post('http://localhost:9001/crop/crop', data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = res.data;
      if (result.success) {
        setMessage('✅ Crop uploaded successfully!');
        setStatus('success');
        setFormData({ name: '', type: '', pricePerKg: '', quantityKg: '', location: '' });
        setImage("");
        navigate('/')
      } else {
        setMessage(result.message || 'Failed to upload crop.');
        setStatus('error');
      }
    } catch (error) {
      console.error(error);
      if (error.response) {
        if (error.response.status === 401 || error.response.status === 403) {
          setMessage('❌ Invalid or expired token. Please login again.');
          setStatus('error');
          localStorage.removeItem('token');
        } else {
          setMessage(error.response.data.message || 'Server Error');
          setStatus('error');
        }
      } else {
        setMessage('Network error or server is unreachable.');
        setStatus('error');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 to-white py-10 px-4">
      <div className="max-w-lg mx-auto bg-white p-8 rounded-2xl shadow-xl">
        <h2 className="text-3xl font-bold text-green-700 mb-6 text-center">🌾 Upload New Crop</h2>

        {user && (
          <p className="text-sm text-red-600 text-center mb-4">
            Logged in as: <strong>{user.user || user.email || user.name}</strong>
          </p>
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
              <option value="Crops">Crops</option>
              <option value="Vegetable">Vegetable</option>
              <option value="Fruits">Fruits</option>
              <option value="Nursery & Plants">Nursery & Plants</option>
              <option value="Dry Fruits">Dry Fruits</option>

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

          <button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition duration-200 flex justify-center items-center gap-2"
          >
            <Upload size={18} />
            Upload Crop
          </button>
        </form>
      </div>
    </div>
  );
};

const Field = ({ icon, name, value, onChange, placeholder, type = 'text' }) => (
  <div className="flex items-center gap-2">
    {icon}
    <input
      name={name}
      value={value}
      onChange={onChange}
      type={type}
      placeholder={placeholder}
      required
      className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-green-400 outline-none"
    />
  </div>
);

export default CropUpload;

