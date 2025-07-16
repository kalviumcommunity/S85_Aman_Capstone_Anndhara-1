import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const handleGoogleLogin = () => { 
    window.location.href = 'http://localhost:9001/auth/google';
  };
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      setError("Please enter both email and password.");
      setSuccess("");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address.");
      setSuccess("");
      return;
    }

    try {


      const resp = await axios.post("http://localhost:9001/user/login", formData);

      if (import.meta.env.MODE === 'development') console.log(resp);

      const { data, token } = resp.data;

      // Save token and user info to localStorage
      localStorage.setItem("user", JSON.stringify({
        token,
        id: data._id, // Store MongoDB _id as 'id' to match JWT token structure
        _id: data._id, // Always include _id for MongoDB compatibility
        username: data.username,
        email: data.email,
        role: data.role,
      }));

      setSuccess("Login successful!");
      setError("");
      setTimeout(() => {
        navigate('/');
      }, 1500);  // 1.5 seconds delay to see message



    } catch (err) {
      const backendMessage =
        err.response?.data?.error || err.response?.data?.message || "Login failed. Please try again.";

      setError(backendMessage || 'Login failed. Please try again.');
      setSuccess("");
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-green-100 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold text-green-600">FarmConnect</h1>
        </div>

        <h2 className="text-3xl font-bold mb-2 text-gray-800">Login to Your Account</h2>
        <p className="text-gray-600 mb-6">Welcome back! Please login to continue.</p>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-gray-700 font-semibold mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-gray-700 font-semibold mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {error && (
            <div className="flex items-center text-red-600 font-semibold mt-4 mb-2 px-3 py-2 border border-red-600 rounded bg-red-50">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {error}
            </div>
          )}
          {success && (
            <div className="text-green-600 font-semibold mt-4 mb-2 px-3 py-2 border border-green-600 rounded bg-green-50">
              {success}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-md transition-colors duration-200"
          >
            Login
          </button>
        </form>

        {/* OR separator */}
        <div className="my-6 text-center text-gray-400 font-semibold">OR</div>
        <button onClick={handleGoogleLogin} className="mt-4 bg-red-500 text-white p-2 rounded w-full">Login with Google</button>

        <p className="mt-6 text-center text-gray-600">
          Don't have an account?{" "}
          <Link to="/register" className="text-green-600 hover:underline">
            SignUp
          </Link>
        </p>
      </div>
    </div>
  );
}
