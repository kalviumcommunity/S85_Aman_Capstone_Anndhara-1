import React, { useEffect, useState } from 'react';
import { ShoppingCart, MapPin, Package, Tag, Image as ImageIcon } from 'lucide-react';
import axios from 'axios';

const CropList = () => {
  console.log('🚀 CropList component loaded!');
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [imageErrors, setImageErrors] = useState({});
  const user = JSON.parse(localStorage.getItem('user'));
  console.log('👤 User from localStorage:', user);

  const handleAddToCart = async (crop) => {
    if (!user || user.role !== 'buyer') {
      setMessage('You must be logged in as a buyer to add to cart.');
      return;
    }
    try {
      const res = await fetch('https://s85-aman-capstone-anndhara-1-8beh.onrender.com/cart/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          cropId: crop._id,
          quantity: 1,
          proposedPrice: crop.pricePerKg,
        }),
      });
      const data = await res.json();
      console.log('Add to cart response:', data); // Debug log
      if (data.success) {
        setMessage('Added to cart!');
      } else {
        setMessage(data.error || 'Failed to add to cart.');
      }
    } catch (err) {
      setMessage('Failed to add to cart.');
    }
    setTimeout(() => setMessage(''), 2000);
  };

  const handleImageError = (cropId) => {
    setImageErrors(prev => ({ ...prev, [cropId]: true }));
  };

  const fetchCrops = async () => {
    try {
      console.log('🔄 Starting to fetch crops...');
      setLoading(true);
      const response = await axios.get('https://s85-aman-capstone-anndhara-1-8beh.onrender.com/crop/AllCrop');
      console.log('✅ API Response received:', response.data);
      
      if (response.data.crops && response.data.crops.length > 0) {
        console.log(`📊 Found ${response.data.crops.length} crops`);
        response.data.crops.forEach((crop, index) => {
          console.log(`Crop ${index + 1}: ${crop.name}, hasImageDataUrl: ${!!crop.imageDataUrl}`);
        });
      }
      
      setCrops(response.data.crops || []);
      console.log('✅ Crops set in state');
    } catch (error) {
      console.error('❌ Error fetching crops:', error);
      setError('Failed to load crops');
    } finally {
      setLoading(false);
      console.log('✅ Loading finished');
    }
  };

  useEffect(() => {
    console.log('🔄 CropList useEffect triggered - fetching crops...');
    fetchCrops();
  }, []);

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="text-lg text-gray-600">Loading crops...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-green-700 mb-8 text-center">🌾 Available Crops</h2>
        
        {message && (
          <div className="bg-green-100 border border-green-300 text-green-700 px-4 py-3 rounded mb-6 text-center font-semibold">
            {message}
          </div>
        )}
        
        {crops.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">No crops found.</div>
            <p className="text-gray-400 mt-2">Be the first to upload a crop!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {crops.map(crop => (
              <div key={crop._id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                {/* Image Section */}
                <div className="h-48 bg-gray-100 relative">
                  {console.log(`🖼️ Rendering image for crop ${crop.name}:`, {
                    hasImageDataUrl: !!crop.imageDataUrl,
                    hasImageData: !!crop.imageData,
                    imageContentType: crop.imageContentType,
                    imageDataLength: crop.imageData?.length
                  })}
                  {(crop.imageData && crop.imageContentType) ? (
                    <img
                      src={`data:${crop.imageContentType};base64,${crop.imageData}`}
                      alt={crop.name}
                      className="w-full h-full object-cover transition-all duration-500 ease-in-out"
                      loading="lazy"
                      style={{ opacity: '0.8', filter: 'blur(1px)' }}
                      onLoad={(e) => {
                        e.target.style.opacity = '1';
                        e.target.style.filter = 'blur(0px)';
                        console.log(`✅ Database image loaded for ${crop.name}`);
                      }}
                      onError={(e) => {
                        console.error(`❌ Database image failed for ${crop.name}`);
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-100 to-green-200">
                      <div className="text-center">
                        <div className="animate-pulse">
                          <div className="w-12 h-12 bg-green-300 rounded-full mx-auto mb-2"></div>
                          <span className="text-gray-500 text-sm">Loading Image...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="w-full h-full flex-col items-center justify-center bg-gradient-to-br from-green-100 to-green-200" style={{display: 'none'}}>
                    <ImageIcon size={48} className="text-green-400" />
                    <span className="text-xs text-gray-500 mt-2">Image not available</span>
                  </div>
                </div>
                
                {/* Content Section */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold text-gray-800">{crop.name}</h3>
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full capitalize">
                      {crop.type}
                    </span>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Package size={16} />
                      <span className="text-sm">₹{crop.pricePerKg}/kg</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Tag size={16} />
                      <span className="text-sm">{crop.quantityKg} kg available</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin size={16} />
                      <span className="text-sm">{crop.location}</span>
                    </div>
                  </div>
                  
                  {crop.seller && (
                    <div className="text-xs text-gray-500 mb-4">
                      Seller: {crop.seller.username || crop.seller.email}
                    </div>
                  )}
                  
                  {user && user.role === 'buyer' && (
                    <button
                      onClick={() => handleAddToCart(crop)}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 flex items-center justify-center gap-2"
                    >
                      <ShoppingCart size={18} />
                      Add to Cart
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CropList;
