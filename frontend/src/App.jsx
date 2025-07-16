import React, { useEffect, useState } from 'react';
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
import ProtectedRoute from './component/ProtectedRoute';
import Checkout from './component/Checkout';
import FarmerOrders from './component/FarmerOrders';
import './index.css';
import ChatPage from './component/ChatPage';
import { joinSocket, onNewNotification } from './component/socket';
import Navbar from './component/Navbar';
import FavoritesPage from './component/FavoritesPage';
import BuyerOrders from './component/BuyerOrders';
import NotificationPage from './component/NotificationPage';

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
    <>
      <Navbar notifications={notifications} setNotifications={setNotifications} />
      <Routes>
        <Route path='/' element={<DashBoard />} />
        <Route path='/crop-details/:id' element={<CropDetail />} />
        <Route path='/crop-upload' element={<CropUpload />} />
        <Route path='/login' element={<Login />} />
        <Route path='/register' element={<Sign />} />
        <Route path='/farmer-messages' element={<FarmerMessages />} />
        <Route path='/oauth-success' element={<OAuthSuccess />} />
        <Route path='/profile' element={<Profile />} />
        <Route path='/cart' element={<Cart />} />
        <Route path='/checkout' element={<Checkout />} />
        <Route path='/protected' element={<ProtectedRoute />} />
        <Route path='/farmer-orders' element={<FarmerOrders />} />
        <Route path='/buyer-orders' element={<BuyerOrders />} />
        <Route path='/chat/:otherUserId' element={<ChatPage />} />
        <Route path='/favorites' element={<FavoritesPage />} />
        <Route path='/notifications' element={<NotificationPage setNotifications={setNotifications} />} />
      </Routes>
    </>
  );
}

export default App;
