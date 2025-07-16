import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const getImageUrl = (imageUrl) => {
  if (!imageUrl) return null;
  return imageUrl.startsWith('http')
    ? imageUrl
    : `http://localhost:9001${imageUrl}`;
};

const CropDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [crop, setCrop] = useState(null);
  const [farmer, setFarmer] = useState(null);
  const [loadingCrop, setLoadingCrop] = useState(true);
  const [loadingFarmer, setLoadingFarmer] = useState(false);
  const [loadingRatings, setLoadingRatings] = useState(false);
  const [ratings, setRatings] = useState([]);
  const [rating, setRating] = useState('');
  const [comment, setComment] = useState('');
  const [submitMessage, setSubmitMessage] = useState('');
  const [ratingError, setRatingError] = useState('');
  const [commentError, setCommentError] = useState('');
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [orderQuantity, setOrderQuantity] = useState('');
  const [orderMessage, setOrderMessage] = useState('');
  const [addCartMessage, setAddCartMessage] = useState('');

  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    const fetchCrop = async () => {
      try {
        const res = await fetch(`http://localhost:9001/crop/${id}`);
        const data = await res.json();
        setCrop(data.crop);
        setLoadingCrop(false);

        if (data.crop?.seller?._id) {
          fetchFarmer(data.crop.seller._id);
        }
      } catch (err) {
        console.error("Error fetching crop:", err);
        setLoadingCrop(false);
      }
    };

    const fetchFarmer = async (farmerId) => {
      setLoadingFarmer(true);
      try {
        const res = await fetch(`http://localhost:9001/user?id=${farmerId}`);
        const data1 = await res.json();

        const farmer =
          data1.data?.find((user) => user._id === farmerId) ||
          data1.farmer?.find((user) => user._id === farmerId);

        setFarmer(farmer);
      } catch (err) {
        console.error("Error fetching farmer:", err);
      } finally {
        setLoadingFarmer(false);
      }
    };

    fetchCrop();
  }, [id]);

  useEffect(() => {
    if (!farmer?._id) return;

    const fetchRatings = async () => {
      setLoadingRatings(true);
      try {
        const res = await fetch(`http://localhost:9001/rating/getReview`);
        const data = await res.json();

        if (data.ok && Array.isArray(data.rating)) {
          const farmerRatings = data.rating.filter(r => r.reviewedUser?._id === farmer._id);
          setRatings(farmerRatings);
        } else {
          setRatings([]);
        }
      } catch (err) {
        console.error("Error fetching ratings:", err);
        setRatings([]);
      } finally {
        setLoadingRatings(false);
      }
    };

    fetchRatings();
  }, [farmer]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();

    setRatingError('');
    setCommentError('');
    setSubmitMessage('');

    let valid = true;
    if (!rating) {
      setRatingError('Rating is required.');
      valid = false;
    }
    if (!comment.trim()) {
      setCommentError('Comment is required.');
      valid = false;
    }

    if (!valid) return;

    if (!user || !user.id) {
      setSubmitMessage('You must be logged in to leave a review.');
      return;
    }

    try {
      const res = await fetch(`http://localhost:9001/rating/Review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          rating,
          comment,
          reviewer: user.id,
          reviewedUser: farmer?._id,
        }),
      });

      const data = await res.json();

      if (data.ok) {
        setSubmitMessage('Review submitted successfully!');
        setRating('');
        setComment('');
        const updatedRatings = [...ratings, { rating, comment, reviewer: user.id }];
        setRatings(updatedRatings);
      } else {
        setSubmitMessage(data.message || 'Failed to submit review.');
      }
    } catch (err) {
      console.error('Error submitting review:', err);
      setSubmitMessage('Something went wrong while submitting the review.');
    }
  };

  const handleAddToCart = async () => {
    if (!user || user.role !== 'buyer') {
      setAddCartMessage('You must be logged in as a buyer to add to cart.');
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
      if (data.success) {
        setAddCartMessage('Added to cart!');
      } else {
        setAddCartMessage(data.error || 'Failed to add to cart.');
      }
    } catch (err) {
      setAddCartMessage('Failed to add to cart.');
    }
    setTimeout(() => setAddCartMessage(''), 2000);
  };

  if (loadingCrop) {
    return <p className="text-center mt-8 text-green-700">Loading crop details...</p>;
  }

  if (!crop) {
    return <p className="text-center mt-8 text-red-600">Crop not found.</p>;
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <button onClick={() => navigate(-1)} className="text-green-700 mb-4 underline">
        ← Go Back
      </button>

      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
        {getImageUrl(crop.imageUrl) && (
          <img
            src={getImageUrl(crop.imageUrl)}
            alt={crop.name}
            className="rounded w-full h-64 object-cover mb-4 border"
          />
        )}
        <h2 className="text-2xl font-bold text-green-700 mb-2">{crop.name}</h2>
        <p><strong>Type:</strong> {crop.type}</p>
        <p><strong>Price per Kg:</strong> ₹{crop.pricePerKg}</p>
        <p><strong>Quantity:</strong> {crop.quantityKg} Kg</p>
        <p><strong>Location:</strong> {crop.location}</p>

        <div className="mt-6">
          <h3 className="text-lg font-semibold text-green-800">Farmer Info</h3>
          {loadingFarmer ? (
            <p className="text-gray-500">Loading farmer details...</p>
          ) : farmer ? (
            <>
              <p><strong>Name:</strong> {farmer.username}</p>
              <p><strong>Email:</strong> {farmer.email}</p>
              <p><strong>Phone:</strong> {farmer.phone}</p>
              <p><strong>Role:</strong> {farmer.role}</p>

              {/* Chat and Order buttons for buyers only */}
              {user && user.id !== farmer._id && user.role === 'buyer' && (
                <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                  <button
                    onClick={() => navigate(`/chat/${farmer._id}?cropId=${crop._id}`)}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold transition-colors"
                  >
                    💬 Message Farmer
                  </button>
                </div>
              )}
            </>
          ) : (
            <p className="text-red-500">Farmer info not found.</p>
          )}
        </div>

        {/* Only show reviews if user is the crop owner (farmer) or a buyer */}
        {((user && user.role === 'buyer') || (user && user.role === 'farmer' && crop?.seller?._id === user.id)) && (
          <div className="mt-8 border-t pt-4">
            <h3 className="text-lg font-semibold text-green-800 mb-2">Reviews</h3>
            {loadingRatings ? (
              <p className="text-gray-500">Loading reviews...</p>
            ) : ratings.length === 0 ? (
              <p className="text-gray-600">No reviews yet.</p>
            ) : (
              ratings.map((r, index) => (
                <div key={index} className="mb-4 border-b pb-2">
                  <p><strong>Rating:</strong> {r.rating} / 5</p>
                  <p><strong>Comment:</strong> {r.comment}</p>
                  <p className="text-sm text-gray-500">
                    Reviewer: {
                      r.reviewerUsername ||
                      (r.reviewer && typeof r.reviewer === 'object' ? r.reviewer.username : r.reviewer) ||
                      'Anonymous'
                    }
                  </p>
                </div>
              ))
            )}
          </div>
        )}

        {farmer && (
          <div className="mt-8 border-t pt-4">
            <h3 className="text-lg font-semibold text-green-800 mb-2">Add a Review</h3>

            {!user ? (
              <p className="text-red-600">You must be logged in to leave a review.</p>
            ) : user.role !== 'buyer' ? (
              <p className="text-red-600">Only buyers can leave a review or comment on crops.</p>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div>
                  <label className="block mb-1 font-medium">Rating</label>
                  <select
                    value={rating}
                    onChange={(e) => {
                      setRating(e.target.value);
                      setRatingError('');
                    }}
                    className={`w-full border p-2 rounded ${ratingError ? 'border-red-600' : ''}`}
                  >
                    <option value="">Select Rating</option>
                    {[1, 2, 3, 4, 5].map((num) => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                  {ratingError && <p className="text-red-600 text-sm mt-1">{ratingError}</p>}
                </div>

                <div>
                  <label className="block mb-1 font-medium">Comment</label>
                  <textarea
                    value={comment}
                    onChange={(e) => {
                      setComment(e.target.value);
                      setCommentError('');
                    }}
                    rows={2}
                    className={`w-full border p-2 rounded ${commentError ? 'border-red-600' : ''}`}
                    placeholder="Share your experience"
                  />
                  {commentError && <p className="text-red-600 text-sm mt-1">{commentError}</p>}
                </div>

                <button
                  type="submit"
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  Submit Review
                </button>

                {submitMessage && (
                  <p className="mt-2 text-sm text-green-700">{submitMessage}</p>
                )}
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CropDetails;
