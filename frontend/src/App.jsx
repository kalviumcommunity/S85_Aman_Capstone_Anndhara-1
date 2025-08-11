import React, { useEffect, useState, createContext, useContext } from 'react';
import { Routes, Route } from 'react-router-dom';
import DashBoard from './component/Dashboard';
import CropDetail from './component/CropDetail';
import CropUpload from './component/CropUpload';
import Login from './component/Login';
import Sign from './component/Sign';
import FarmerMessages from './component/FarmerMessages';
import OAuthSuccess from './component/OAuthSuccess';
import Cart from './component/Cart';
import Profile from './component/profile';
import { ProtectedRoute, FarmerRoute } from './component/ProtectedRoute';
import Checkout from './component/Checkout';
import FarmerOrders from './component/FarmerOrders';
import './index.css';
import ChatPage from './component/ChatPage';
import { joinSocket, onNewNotification } from './component/socket';
import Navbar from './component/Navbar';
import FavoritesPage from './component/FavoritesPage';
import BuyerOrders from './component/BuyerOrders';
import NotificationPage from './component/NotificationPage';
import { UserProvider } from './store/authStore';

// Context for sharing category state
const CategoryContext = createContext();

export const useCategory = () => {
  const context = useContext(CategoryContext);
  if (!context) {
    throw new Error('useCategory must be used within a CategoryProvider');
  }
  return context;
};

// Layout component to manage navbar state
const Layout = ({ children, notifications, setNotifications }) => {
  const [selectedCategory, setSelectedCategory] = useState('Crops');
  
  return (
    <CategoryContext.Provider value={{ selectedCategory, setSelectedCategory }}>
      <Navbar 
        notifications={notifications} 
        setNotifications={setNotifications} 
        selectedCategory={selectedCategory} 
        setSelectedCategory={setSelectedCategory} 
      />
      {children}
    </CategoryContext.Provider>
  );
};

function App() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && (user._id || user.id)) {
      joinSocket(user._id || user.id);
      // Listen for real-time notifications
      onNewNotification((notif) => {
        setNotifications((prev) => [notif, ...prev]);
      });
      // Fetch notifications from backend
      fetch('http://localhost:9001/notification', {
        headers: { Authorization: `Bearer ${user.token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && Array.isArray(data.notifications)) {
            setNotifications(data.notifications);
          }
        });
    }
  }, []);

  return (
    <UserProvider>
      <Layout notifications={notifications} setNotifications={setNotifications}>
        <Routes>
          <Route path='/' element={<DashBoard />} />
          <Route path='/crop-details/:id' element={<CropDetail />} />
          <Route path='/crop-upload' element={<FarmerRoute><CropUpload /></FarmerRoute>} />
          <Route path='/login' element={<Login />} />
          <Route path='/register' element={<Sign />} />
          <Route path='/farmer-messages' element={<FarmerRoute><FarmerMessages /></FarmerRoute>} />
          <Route path='/oauth-success' element={<OAuthSuccess />} />
          <Route path='/profile' element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path='/cart' element={<ProtectedRoute><Cart /></ProtectedRoute>} />
          <Route path='/checkout' element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
          <Route path='/protected' element={<ProtectedRoute />} />
          <Route path='/farmer-orders' element={<FarmerRoute><FarmerOrders /></FarmerRoute>} />
          <Route path='/buyer-orders' element={<ProtectedRoute><BuyerOrders /></ProtectedRoute>} />
          <Route path='/chat/:otherUserId' element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
          <Route path='/favorites' element={<ProtectedRoute><FavoritesPage /></ProtectedRoute>} />
          <Route path='/notifications' element={<ProtectedRoute><NotificationPage setNotifications={setNotifications} /></ProtectedRoute>} />
        </Routes>
      </Layout>
    </UserProvider>
  );
}

export default App;
