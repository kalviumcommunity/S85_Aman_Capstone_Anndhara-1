import { useEffect, useState } from 'react';
import { useUser } from '../store/authStore';

const OAuthSuccess = () => {
  const { updateUser } = useUser();
  const [status, setStatus] = useState('Processing login...');

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token');
    if (token) {
      setStatus('Fetching user data...');
      
      // Fetch user data using the token
      fetch('https://s85-aman-capstone-anndhara-1-8beh.onrender.com/user/me', {
        headers: { 
          Authorization: `Bearer ${token}` 
        }
      })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          const userData = {
            token,
            id: data.data._id,
            _id: data.data._id,
            username: data.data.username,
            email: data.data.email,
            role: data.data.role || '', // Empty role - user must set it in profile
            phone: data.data.phone || '' // Default to empty string if phone not set
          };

          // Update both localStorage and global user state
          localStorage.setItem('user', JSON.stringify(userData));
          updateUser(userData); // This will immediately update the UI
          
          // Always redirect to home page after successful login
          setStatus('Login successful! Redirecting to home page...');
          // Redirect to dashboard (root path)
          setTimeout(() => {
            window.location.href = '/';
          }, 1000);
        } else {
          setStatus('Failed to fetch user data. Please try logging in again.');
        }
      })
      .catch(err => {
        console.error('Error fetching user data:', err);
        setStatus('Error occurred. Please try logging in again.');
      });
    } else {
      setStatus('No token found. Please try logging in again.');
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50">
      <div className="bg-white shadow-xl rounded-lg p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Processing Google Login</h2>
        <p className="text-gray-600">{status}</p>
      </div>
    </div>
  );
};

export default OAuthSuccess;