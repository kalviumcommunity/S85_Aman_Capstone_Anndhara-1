import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import { useCart } from '../store/cartStore';
import { useUser } from '../store/authStore';
import { useCategory } from '../App';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/** 
 * Get the image source for display - prefer Cloudinary URL, then Base64, else inline SVG placeholder
 * @param {object} crop - The crop object
 * @returns {string} - Image source (Cloudinary URL, Base64 data URL, or inline SVG placeholder)
 */
const getImageSrc = (crop) => {
  // Prefer Cloudinary URL if present
  if (crop.imageUrl) return crop.imageUrl;
  // Fallback to MongoDB Base64 data if available
  if (crop.imageData && crop.imageContentType) {
    return `data:${crop.imageContentType};base64,${crop.imageData}`;
  }
  // Inline SVG placeholder (no external DNS dependency)
  return 'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200">
        <rect width="100%" height="100%" fill="#f0f0f0"/>
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#999" font-family="Arial, sans-serif" font-size="16">
          Image not available
        </text>
      </svg>`
    );
};

// ============================================================================
// PRODUCT CARD COMPONENT
// ============================================================================

/**
 * Individual product card component for displaying crop information
 */
const ProductCard = ({ 
  id, 
  imgSrc, 
  title, 
  description, 
  onViewDetails, 
  onAddToCart, 
  showAddToCart, 
  sellerId, 
  isFavorite, 
  onToggleFavorite,
  index = 0,
}) => {
  const navigate = useNavigate();
  const { user, isBuyer } = useUser();
  const [mounted, setMounted] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60 * Math.min(index, 10));
    return () => clearTimeout(t);
  }, [index]);

  return (
    <div
      className={
        'bg-white border-2 border-gray-100 rounded-2xl shadow-lg p-6 transform transition-all duration-500 ease-out hover:shadow-2xl hover:-translate-y-1 hover:border-green-200 group ' +
        (mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3')
      }
    >
      {/* Product Image and Favorite Button */}
      <div className='flex justify-between items-start'>
        {imgSrc && (
          <div className='relative overflow-hidden rounded-xl mb-4 w-full bg-gray-100' style={{ paddingTop: '66.666%' }}>
            {/* 4:3 aspect ratio wrapper; image fills the frame consistently */}
            {/* Shimmer skeleton while image loads */}
            {!imgLoaded && (
              <div className='absolute inset-0 animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200' />
            )}
            <img
              src={imgSrc}
              alt={title}
              className='absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-110'
              loading="lazy"
              onLoad={(e) => {
                e.target.style.opacity = '1';
                setImgLoaded(true);
              }}
              onError={(e) => {
                const inlinePlaceholder = 'data:image/svg+xml;utf8,' + encodeURIComponent(
                  `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200">
                    <rect width="100%" height="100%" fill="#f0f0f0"/>
                    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#999" font-family="Arial, sans-serif" font-size="16">
                      Image error
                    </text>
                  </svg>`
                );
                e.target.src = inlinePlaceholder;
              }}
              style={{ opacity: '0.9' }}
            />
            <div className='absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300'></div>
          </div>
        )}
        {typeof isFavorite !== 'undefined' && (
          <button
            aria-label={isFavorite ? 'Unfavorite' : 'Favorite'}
            className='absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full p-2 text-red-500 text-lg focus:outline-none hover:scale-110 hover:bg-white transition-all duration-200 shadow-md'
            onClick={onToggleFavorite}
          >
            {isFavorite ? <FaHeart /> : <FaRegHeart />}
          </button>
        )}
      </div>

      {/* Product Information */}
      <div className='space-y-3'>
        <h4 className='font-bold text-gray-800 text-xl mb-2 group-hover:text-green-700 transition-colors duration-200'>{title}</h4>
        <p className='text-gray-600 text-sm leading-relaxed line-clamp-2'>{description}</p>
      </div>

      {/* Action Buttons */}
      <button
        aria-label={`View details for ${title}`}
        className='mt-3 bg-gray-700 text-white w-full py-1.5 rounded hover:bg-green-600 transition-all duration-200'
        onClick={() => onViewDetails(id)}
      >
        View Details
      </button>

      {/* Add to Cart Button */}
      {showAddToCart && (
        <div className='flex gap-2 mt-2'>
          <button
            className='flex-1 bg-orange-500 text-white py-1.5 rounded hover:bg-orange-600 transition-all duration-200'
            onClick={() => onAddToCart(id)}
          >
            Add to Cart
          </button>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// MAIN DASHBOARD COMPONENT
// ============================================================================

/**
 * Main Dashboard component - displays crops and handles user interactions
 */
const DashBoard = () => {
  // ========================================================================
  // STATE MANAGEMENT
  // ========================================================================
  const navigate = useNavigate();
  const { selectedCategory } = useCategory();
  const { cart, addToCart } = useCart();
  const { user, isFarmer, isBuyer, hasRole } = useUser();

  // Local state
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [trendingCrops, setTrendingCrops] = useState([]);

  // ========================================================================
  // DATA FETCHING
  // ========================================================================

  /**
   * Fetch all crops from the server
   */
  const fetchCrops = async () => {
    try {
      const response = await fetch('https://s85-aman-capstone-anndhara-1-8beh.onrender.com/crop/AllCrop');
      const data = await response.json();
      const allCrops = data.crops || [];
      setCrops(allCrops);
      
      // Set trending crops (random selection of 6 crops for demo)
      const shuffled = [...allCrops].sort(() => 0.5 - Math.random());
      setTrendingCrops(shuffled.slice(0, 6));
    } catch (error) {
      console.error("Error fetching crops:", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch user's favorite crops
   */
  const fetchFavorites = async () => {
    if (!user || !isBuyer || !user.token) return;

    try {
      const response = await fetch('https://s85-aman-capstone-anndhara-1-8beh.onrender.com/favorite/my', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      const data = await response.json();
      setFavorites(data.favorites?.map(f => f.cropId?._id) || []);
    } catch (error) {
      console.error("Error fetching favorites:", error);
      setFavorites([]);
    }
  };

  // Initialize data on component mount
  useEffect(() => {
    fetchCrops();
  }, []);

  useEffect(() => {
    fetchFavorites();
  }, [user, isBuyer]);

  // ========================================================================
  // DATA PROCESSING
  // ========================================================================

  /**
   * Filter crops based on selected category
   */
  const filteredCrops = selectedCategory === 'Crops'
    ? crops
    : crops.filter(crop => crop.type === selectedCategory);

  // ========================================================================
  // EVENT HANDLERS
  // ========================================================================

  /**
   * Handle viewing crop details
   */
  const handleViewDetails = (cropId) => {
    navigate(`/crop-details/${cropId}`);
  };

  /**
   * Handle adding crop to cart
   */
  const handleAddToCart = (cropId) => {
    const crop = crops.find(c => c._id === cropId);
    if (!crop) return;

    if (!cart.find(item => item._id === cropId)) {
      addToCart(crop);
      alert('Added to cart!');
    } else {
      alert('Already in cart!');
    }
  };

  /**
   * Handle toggling favorite status
   */
  const toggleFavorite = async (cropId, isFav) => {
    if (!user || !user.token || !isBuyer) return;

    const url = `https://s85-aman-capstone-anndhara-1-8beh.onrender.com/favorite/${isFav ? 'remove' : 'add'}`;
    const method = isFav ? 'DELETE' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        },
        body: JSON.stringify({ cropId })
      });

      if (response.ok) {
        setFavorites(favs => 
          isFav 
            ? favs.filter(id => id !== cropId) 
            : [...favs, cropId]
        );
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  // ========================================================================
  // RENDER METHODS
  // ========================================================================

  /**
   * Render loading state
   */
  const renderLoading = () => (
    <p className="text-center mt-8 text-green-700">Loading crops...</p>
  );

  /**
   * Render empty state
   */
  const renderEmpty = () => (
    <p className="text-center text-gray-500">
      No crops available for {selectedCategory}.
    </p>
  );

  /**
   * Render crops grid
   */
  const renderCropsGrid = () => (
    <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'>
      {filteredCrops.map((crop, i) => (
        <ProductCard
          key={crop._id}
          id={crop._id}
          imgSrc={getImageSrc(crop)}
          title={crop.name}
          description={
            <>
          Price: ₹{crop.pricePerKg} Rupess <br />
            Quantity: {crop.quantityKg}/kg
            </>
        }
          onViewDetails={handleViewDetails}
          onAddToCart={handleAddToCart}
          showAddToCart={isBuyer}
          sellerId={crop.seller?._id}
          isFavorite={favorites.includes(crop._id)}
          onToggleFavorite={() => toggleFavorite(crop._id, favorites.includes(crop._id))}
          index={i}
        />
      ))}
    </div>
  );

  return (
    <div className='min-h-screen bg-white font-sans flex flex-col'>
      {/* Hero Section */}
      <section className='bg-green-50 text-center py-14 px-4'>
        <h2 className='text-4xl font-extrabold text-green-700 mb-4'>
          Annadhara is Bharat's Largest Marketplace <br />
          <span className='text-green-800'>
            For Selling and Buying <b>Crops</b>
          </span>
        </h2>
        <p className='text-gray-700 max-w-2xl mx-auto mb-6'>
          Connect Directly with Farmers, Suppliers, and Buyers Across Bharat.
          Get the best prices for quality agricultural products.
        </p>
       
      </section>

      {/* Products Section */}
      <section className='px-6 py-8 flex-grow'>
        <h4 className='text-2xl font-semibold text-green-800 mb-6 text-center'>
          Products Available for Buy & Sell
        </h4>

        {/* Products Display */}
        <div className='min-h-[200px]'>
          {loading ? renderLoading() : 
           filteredCrops.length === 0 ? renderEmpty() : 
           renderCropsGrid()}
        </div>
      </section>

      {/* Footer */}
      <footer className='bg-green-800 text-white text-center py-4 shadow-inner mt-auto'>
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
