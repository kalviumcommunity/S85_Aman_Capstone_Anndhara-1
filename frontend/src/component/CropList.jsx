import React, { useEffect, useState } from 'react';

const CropList = () => {
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const user = JSON.parse(localStorage.getItem('user'));

  const handleAddToCart = async (crop) => {
    if (!user || user.role !== 'buyer') {
      setMessage('You must be logged in as a buyer to add to cart.');
      return;
    }
    try {
      const res = await fetch('http://localhost:9001/cart/add', {
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
      console.error('Add to cart error:', err); // Debug log
    }
    setTimeout(() => setMessage(''), 2000);
  };

  useEffect(() => {
    fetch('http://localhost:9001/crop/AllCrop')
      .then(res => res.json())
      .then(data => {
        setCrops(data.crops || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading crops...</p>;

  return (
    <div>
      <h2>All Crops</h2>
      {message && <div className="text-green-700 font-semibold mb-2">{message}</div>}
      {crops.length === 0 && <p>No crops found.</p>}
      <ul>
        {crops.map(crop => (
          <li key={crop._id} style={{ marginBottom: '20px' }}>
            <h3>{crop.name} ({crop.type})</h3>
            <p>Price per Kg: {crop.pricePerKg}</p>
            <p>Quantity: {crop.quantityKg} Kg</p>
            <p>Location: {crop.location}</p>
            {crop.imageUrl && (
              <img
                src={`http://localhost:9001${crop.imageUrl}`}
                alt={crop.name}
                style={{ width: '150px', height: 'auto' }}
              />
            )}
            {user && user.role === 'buyer' && (
              <button
                onClick={() => handleAddToCart(crop)}
                className="bg-green-600 text-white px-4 py-2 rounded mt-2 hover:bg-green-700"
              >
                Add to Cart
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CropList;
