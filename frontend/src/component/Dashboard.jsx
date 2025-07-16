import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FaSeedling,
  FaCarrot,
  FaAppleAlt,
  FaLeaf,
  FaUserCircle,
  FaHeart,
  FaRegHeart
} from 'react-icons/fa';
import { GiPeanut } from 'react-icons/gi';
import { useCart } from '../store/cartStore';
import { FaShoppingCart } from 'react-icons/fa';

const categories = [
  "Crops",
  "Vegetable",
  "Fruits",
  "Nursery & Plants",
  "Dry Fruits",
];

const categoryIcons = [
  <FaSeedling />, // Crops
  <FaCarrot />,   // Vegetable
  <FaAppleAlt />, // Fruits
  <FaLeaf />,     // Nursery & Plants
  <GiPeanut />,   // Dry Fruits
];

const getImageUrl = (imageUrl) => {
  if (!imageUrl) return null;
  return imageUrl.startsWith('http')
    ? imageUrl
    : `http://localhost:9001${imageUrl}`;
};

const ProductCard = ({ id, imgSrc, title, description, onViewDetails, onOrder, onAddToCart, showAddToCart, showOrder, sellerId, isFavorite, onToggleFavorite }) => {
  const navigate = useNavigate();
  return (
    <div className='bg-white border rounded-lg shadow hover:shadow-2xl p-4 transform transition-transform duration-200 hover:scale-105'>
      <div className='flex justify-between items-start'>
        {imgSrc && (
          <img
            src={imgSrc}
            alt={title}
            className='rounded mb-3 w-full h-40 object-cover border'
          />
        )}
        {typeof isFavorite !== 'undefined' && (
          <button
            aria-label={isFavorite ? 'Unfavorite' : 'Favorite'}
            className='ml-2 text-red-500 text-xl focus:outline-none hover:scale-110 transition-transform'
            onClick={onToggleFavorite}
          >
            {isFavorite ? <FaHeart /> : <FaRegHeart />}
          </button>
        )}
      </div>
      <h4 className='font-bold text-green-700 text-lg mb-1'>{title}</h4>
      <p className='text-sm text-gray-600'>{description}</p>
      <button
        aria-label={`View details for ${title}`}
        className='mt-3 bg-gray-700 text-white w-full py-1.5 rounded hover:bg-green-600 transition-all duration-200'
        onClick={() => onViewDetails(id)}
      >
        View Details
      </button>
      {/* Message button for buyers only, not the seller */}
      {(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        return user && user.role === 'buyer' && user.id !== sellerId ? (
          <button
            className='mt-2 bg-green-600 text-white w-full py-1.5 rounded hover:bg-green-700 transition-all duration-200'
            onClick={() => navigate(`/chat/${sellerId}?cropId=${id}`)}
          >
            💬 Message
          </button>
        ) : null;
      })()}
      <div className='flex gap-2 mt-2'>
        {showAddToCart && (
          <>
            <button
              className='flex-1 bg-orange-500 text-white py-1.5 rounded hover:bg-orange-600 transition-all duration-200'
              onClick={() => onAddToCart(id)}
            >
              Add to Cart
            </button>
          </>
        )}
      </div>
    </div>
  );
};

const DashBoard = () => {
  const navigate = useNavigate();
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Crops');
  const { cart, addToCart } = useCart();
  const user = JSON.parse(localStorage.getItem('user'));
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    fetch('http://localhost:9001/crop/AllCrop')
      .then(res => res.json())
      .then(data => {
        setCrops(data.crops || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching crops:", err);
        setLoading(false);
      });

    // Fetch favorites for buyers
    if (user && user.role === 'buyer') {
      fetch('http://localhost:9001/favorite/my', {
        headers: { Authorization: `Bearer ${user.token}` }
      })
        .then(res => res.json())
        .then(data => setFavorites(data.favorites?.map(f => f.cropId?._id) || []))
        .catch(() => setFavorites([]));
    }
  }, [user]);

  const filteredCrops = selectedCategory === 'Crops'
    ? crops.filter(crop => crop.available !== false && crop.quantityKg > 0)
    : crops.filter(crop => crop.type.toLowerCase() === selectedCategory.toLowerCase() && crop.available !== false && crop.quantityKg > 0);

  const handleViewDetails = (cropId) => {
    navigate(`/crop-details/${cropId}`);
  };

  const handleOrder = async (cropId) => {
    if (!user || user.role !== 'buyer') {
      alert('You must be logged in as a buyer to place an order.');
      return;
    }
    const crop = crops.find(c => c._id === cropId);
    if (!crop) {
      alert('Crop not found.');
      return;
    }
    const quantity = 1; // You can prompt for this
    const address = prompt('Enter delivery address:');
    if (!address) return;
    const orderBody = {
      crop: crop._id,
      quantityOrdered: quantity,
      proposedPrice: crop.pricePerKg,
      address
    };
    const res = await fetch('http://localhost:9001/order/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user.token}`
      },
      body: JSON.stringify(orderBody)
    });
    const data = await res.json();
    if (data.success) {
      alert('Order placed successfully!');
    } else {
      alert(data.error || 'Failed to place order.');
    }
  };

  const handleAddToCart = (cropId) => {
    const crop = crops.find(c => c._id === cropId);
    if (!cart.find(item => item._id === cropId)) {
      addToCart(crop);
      alert('Added to cart!');
    } else {
      alert('Already in cart!');
    }
  };

  const toggleFavorite = async (cropId, isFav) => {
    if (!user || user.role !== 'buyer') return;
    const url = `http://localhost:9001/favorite/${isFav ? 'remove' : 'add'}`;
    const method = isFav ? 'DELETE' : 'POST';
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user.token}`
      },
      body: JSON.stringify({ cropId })
    });
    if (res.ok) {
      setFavorites(favs => isFav ? favs.filter(id => id !== cropId) : [...favs, cropId]);
    }
  };

  return (
    <div className='min-h-screen bg-white font-sans'>
      {/* Navbar */}
      <nav className='flex flex-wrap items-center justify-between bg-white shadow-md px-6 py-4'>
        <Link to="/" className='text-3xl font-extrabold text-green-700'>Annadhara</Link>
        <form className='flex-grow max-w-xs mx-4'>
          <input
            type="search"
            placeholder='Search Product'
            className='w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-green-500'
          />
        </form>
        <ul className='hidden lg:flex space-x-6 text-sm font-semibold text-orange-600'>
          {categories.map((item, i) => (
            <li key={item}>
              <button
                onClick={() => setSelectedCategory(item)}
                className={`flex items-center gap-1 hover:text-green-700 ${selectedCategory === item ? 'text-green-700 font-bold' : ''}`}
              >
                <span className='text-lg'>{categoryIcons[i]}</span>
                {item}
              </button>
            </li>
          ))}
        </ul>
        <div className='flex space-x-2 items-center'>
          <Link to="/cart" className='relative flex items-center px-3 py-1 rounded-full hover:bg-green-100 transition-all'>
            <FaShoppingCart className='text-2xl text-green-700' />
            {cart.length > 0 && (
              <span className='absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full px-1'>{cart.length}</span>
            )}
          </Link>
          {user && (
            <Link to="/profile" className='flex items-center gap-2 px-3 py-1 rounded-full hover:bg-green-100 transition-all'>
              <FaUserCircle className='text-2xl text-green-700' />
              <span className='hidden md:inline text-green-700 font-semibold'>{user.username}</span>
            </Link>
          )}
          {user && user.role === 'farmer' && (
            <Link 
              to="/farmer-messages" 
              className='bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-semibold transition-all'
            >
              💬 Messages
            </Link>
          )}
          {user && user.role === 'farmer' && (
            <Link
              to="/farmer-orders"
              className='bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 font-semibold transition-all'
            >
              📦 My Orders
            </Link>
          )}
          <Link to="/crop-upload" className='bg-green-500 text-white px-4 py-1 rounded hover:bg-green-600 font-semibold transition-all'><b>Seller</b></Link>
          <Link to="/login" className='bg-green-500 text-white px-4 py-1 rounded hover:bg-green-600 font-semibold transition-all'><b>Login</b></Link>
          <Link to="/register" className='bg-green-500 text-white px-4 py-1 rounded hover:bg-green-600 font-semibold transition-all'><b>Sign</b></Link>
        </div>
      </nav>

      {/* Hero */}
      <section className='bg-green-50 text-center py-14 px-4'>
        <h2 className='text-4xl font-extrabold text-green-700 mb-4'>
          Annadhara is Bharat's Largest Marketplace <br />
          <span className='text-green-800'>For Selling and Buying <b>Crops</b></span>
        </h2>
        <p className='text-gray-700 max-w-2xl mx-auto mb-6'>
          Connect Directly with Farmers, Suppliers, and Buyers Across Bharat.
          Get the best prices for quality agricultural products.
        </p>
        <button className='bg-green-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-green-700 hover:text-orange-400 transition-transform duration-200 transform hover:scale-105'>
          <b>Start Trading Now</b>
        </button>
      </section>

      {/* Products */}
      <section className='px-6 py-8'>
        <h4 className='text-2xl font-semibold text-green-800 mb-6 text-center'>
          Products Available for Buy & Sell
        </h4>

        {loading ? (
          <p className="text-center mt-8 text-green-700">Loading crops...</p>
        ) : filteredCrops.length === 0 ? (
          <p className="text-center text-gray-500">No crops available for {selectedCategory}.</p>
        ) : (
          <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'>
            {filteredCrops.map(crop => (
              <ProductCard
                key={crop._id}
                id={crop._id}
                imgSrc={getImageUrl(crop.imageUrl)}
                title={crop.name}
                description={`Type: ${crop.type} | ₹${crop.pricePerKg}/kg | ${crop.quantityKg} Kg | ${crop.location}`}
                onViewDetails={handleViewDetails}
                onOrder={handleOrder}
                onAddToCart={handleAddToCart}
                showAddToCart={user && user.role === 'buyer'}
                showOrder={user && user.role === 'buyer'}
                sellerId={crop.seller?._id}
                isFavorite={favorites.includes(crop._id)}
                onToggleFavorite={() => toggleFavorite(crop._id, favorites.includes(crop._id))}
              />
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className='bg-green-800 text-white text-center py-4 mt-10 shadow-inner'>
        <div className='flex flex-col md:flex-row items-center justify-center gap-2'>
          <span className='font-bold text-lg'>Annadhara</span>
          <span className='text-sm'>&copy; 2025. All rights reserved.</span>
          <span className='text-xs text-green-200'>Empowering Rural India 🌾</span>
        </div>
      </footer>
    </div>
  );
};

export default DashBoard;
