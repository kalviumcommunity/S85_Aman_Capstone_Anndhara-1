import { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize user from localStorage
    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      if (userData && userData.token) {
        setUser(userData);
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
    }
    setLoading(false);
  }, []);

  // Listen for localStorage changes
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'user') {
        try {
          const userData = e.newValue ? JSON.parse(e.newValue) : null;
          setUser(userData);
        } catch (error) {
          console.error('Error parsing user data:', error);
          setUser(null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const updateUser = (newUserData) => {
    setUser(newUserData);
    localStorage.setItem('user', JSON.stringify(newUserData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const value = {
    user,
    loading,
    updateUser,
    logout,
    isLoggedIn: !!user?.token,
    isFarmer: user?.role === 'farmer',
    isBuyer: user?.role === 'buyer',
    hasRole: !!user?.role && user.role !== '',
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
