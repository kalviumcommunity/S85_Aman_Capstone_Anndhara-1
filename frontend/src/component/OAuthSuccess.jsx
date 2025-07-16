import { useEffect } from 'react';

const OAuthSuccess = () => {
  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token');
    if (token) {
      localStorage.setItem('user', JSON.stringify({ token }));
      window.location.href = '/dashboard';
    }
  }, []);

  return <div className="text-center mt-10">Processing login...</div>;
};
export default OAuthSuccess;