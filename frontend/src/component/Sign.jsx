import { useState } from "react";
import axios from 'axios';

import { Link, useNavigate } from "react-router-dom";
export default function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    phone: ""
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.username || !formData.password || !formData.phone) {
      setError("Please fill in all required fields.");
      setSuccess("");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address.");
      setSuccess("");
      return;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters. Please choose a stronger password.");
      setSuccess("");
      return;
    }
    const phoneRegex = /^(\+91)?[6-9]\d{9}$/;
    if (!phoneRegex.test(formData.phone)) {
      setError("Please enter a valid Indian phone number (10 digits).");
      setSuccess("");
      return;
    }
    try {
      const resp = await axios.post('http://localhost:9001/user/register', formData);
      const { user, token } = resp.data;

      localStorage.setItem('user', JSON.stringify({ 
        token, 
        id: user._id, // Store MongoDB _id as 'id' to match JWT token structure
        _id: user._id, // Always include _id for MongoDB compatibility
        username: user.username,
        email: user.email,
        role: user.role,
        phone: user.phone
      }));

      setFormData({
        username: "",
        email: "",
        password: "",
        phone: ""
      })
      setSuccess("Signup successful! Please login.");
      setError("");
      navigate('/login')
    } catch (err) {
      const backendMessage = err.response?.data?.error || err.response?.data?.message || "SignUp falied. Please Try Again"
      setError(backendMessage);
      setSuccess("");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-100 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full flex overflow-hidden">

        <div className="w-1/2 p-8">

          <div className="mb-8 text-center">
            <h1 className="text-4xl font-extrabold text-green-600">FarmConnect</h1>
          </div>

          <h2 className="text-3xl font-bold mb-2 text-gray-800">Create Your Account</h2>
          <p className="text-gray-600 mb-6">Join our agricultural marketplace today</p>


          <form onSubmit={handleSignup} className="space-y-5">

            <div>
              <label htmlFor="username" className="block text-gray-700 font-semibold mb-1">
                Username
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Enter your username"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-gray-700 font-semibold mb-1">
                Email
              </label>
              <input

                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-gray-700 font-semibold mb-1">
                Password
              </label>
              <input

                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-gray-700 font-semibold mb-1">
                Phone
              </label>
              <input

                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Role selector */}

            {/* Error message */}
            {success && <div className="text-green-600 font-semibold mt-4 mb-2 px-3 py-2 border border-green-600 rounded bg-green-50">{success}</div>}
            {error && (
              <div className="flex items-center text-red-600 font-semibold mt-4 mb-2 px-3 py-2 border border-red-600 rounded bg-red-50">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {error}
              </div>
            )}
            {/* Success message */}

            {/* Submit button */}
            <button
              type="submit"
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-md transition-colors duration-200"
            >
              Create Account
            </button>
          </form>

          {/* Footer */}
          <p className="mt-6 text-center text-gray-600">
            Already have an account?{" "}
            < Link to="/login" className="text-green-600 hover:underline">
              Sign In
            </Link>
          </p>
        </div>

        {/* Right side banner */}
        <div className="w-1/2 bg-green-50 p-10 flex flex-col justify-center">
          <h3 className="text-2xl font-semibold mb-4 text-green-700">Farm to Table. Direct.</h3>
          <p className="text-gray-700">
            Connect with local buyers or sell your produce directly to customers nationwide.
          </p>
        </div>
      </div>
    </div>
  );
}
