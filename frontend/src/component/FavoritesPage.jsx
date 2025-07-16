import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaHeart } from 'react-icons/fa';

const FavoritesPage = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const user = JSON.parse(localStorage.getItem('user'));
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.role !== 'buyer') {
      navigate('/login');
      return;
    }
    fetch('http://localhost:9001/favorite/my', {
      headers: { Authorization: `Bearer ${user.token}` }
    })
      .then(res => res.json())
      .then(data => {
        setFavorites(data.favorites || []);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to fetch favorites');
        setLoading(false);
      });
  }, [user, navigate]);

  const handleUnfavorite = async (cropId) => {
    const res = await fetch('http://localhost:9001/favorite/remove', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user.token}`
      },
      body: JSON.stringify({ cropId })
    });
    if (res.ok) {
      setFavorites(favs => favs.filter(f => f.cropId._id !== cropId));
    }
  };

  if (loading) return <div className='p-8 text-green-700'>Loading favorites...</div>;
  if (error) return <div className='p-8 text-red-600'>{error}</div>;

  return (
    <div className='min-h-screen bg-white p-6'>
      <h2 className='text-2xl font-bold mb-4 text-green-700 flex items-center gap-2'>
        <FaHeart className='text-red-500' /> My Favorites
      </h2>
      {favorites.length === 0 ? (
        <p className='text-gray-500'>No favorite crops yet.</p>
      ) : (
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6'>
          {favorites.map(fav => (
            <div key={fav.cropId?._id || fav._id} className='bg-white border rounded-lg shadow p-4 flex flex-col'>
              {fav.cropId && fav.cropId.imageUrl && (
                <img
                  src={`http://localhost:9001${fav.cropId.imageUrl}`}
                  alt={fav.cropId && fav.cropId.name ? fav.cropId.name : 'Unknown Crop'}
                  className='rounded mb-3 w-full h-40 object-cover border'
                  onClick={() => fav.cropId && fav.cropId._id && navigate(`/crop-details/${fav.cropId._id}`)}
                  style={{ cursor: fav.cropId && fav.cropId._id ? 'pointer' : 'default' }}
                />
              )}
              <h4 className='font-bold text-green-700 text-lg mb-1'>{fav.cropId && fav.cropId.name ? fav.cropId.name : 'Unknown Crop'}</h4>
              <p className='text-sm text-gray-600'>Type: {fav.cropId && fav.cropId.type ? fav.cropId.type : 'N/A'} | ₹{fav.cropId && fav.cropId.pricePerKg ? fav.cropId.pricePerKg : 'N/A'}/kg | {fav.cropId && fav.cropId.quantityKg ? fav.cropId.quantityKg : '?'} Kg | {fav.cropId && fav.cropId.location ? fav.cropId.location : 'N/A'}</p>
              <button
                className='mt-2 text-red-500 flex items-center gap-1 hover:scale-110 transition-transform'
                onClick={() => fav.cropId && fav.cropId._id && handleUnfavorite(fav.cropId._id)}
                disabled={!fav.cropId || !fav.cropId._id}
                title={!fav.cropId || !fav.cropId._id ? 'No crop to unfavorite' : ''}
              >
                <FaHeart /> Unfavorite
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FavoritesPage; 