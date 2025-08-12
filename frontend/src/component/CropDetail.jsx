  import React, { useEffect, useState } from 'react';
  import { useParams, useNavigate } from 'react-router-dom';

  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return null;
    return imageUrl.startsWith('http')
      ? imageUrl
      : `https://s85-aman-capstone-anndhara-1-8beh.onrender.com${imageUrl}`;
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
    const [isEditing, setIsEditing] = useState(false);
    const [editFormData, setEditFormData] = useState({
      name: '',
      type: '',
      pricePerKg: '',
      quantityKg: '',
      location: '',
      available: true
    });
    const [updateMessage, setUpdateMessage] = useState('');
    const [updateError, setUpdateError] = useState('');
    const [deleteMessage, setDeleteMessage] = useState('');
    const [deleteError, setDeleteError] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const user = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
      const fetchCrop = async () => {
        try {
          const res = await fetch(`https://s85-aman-capstone-anndhara-1-8beh.onrender.com/crop/${id}`);
          const data = await res.json();
          setCrop(data.crop);
          setEditFormData({
            name: data.crop.name || '',
            type: data.crop.type || '',
            pricePerKg: data.crop.pricePerKg || '',
            quantityKg: data.crop.quantityKg || '',
            location: data.crop.location || '',
            available: data.crop.available !== undefined ? data.crop.available : true
          });
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
          const res = await fetch(`https://s85-aman-capstone-anndhara-1-8beh.onrender.com/user?id=${farmerId}`);
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

    const handleEditToggle = () => {
      setIsEditing(!isEditing);
      setUpdateMessage('');
      setUpdateError('');
      if (!isEditing && crop) {
        setEditFormData({
          name: crop.name || '',
          type: crop.type || '',
          pricePerKg: crop.pricePerKg || '',
          quantityKg: crop.quantityKg || '',
          location: crop.location || '',
          available: crop.available !== undefined ? crop.available : true
        });
      }
    };

    const handleEditSubmit = async (e) => {
      e.preventDefault();
      setUpdateMessage('');
      setUpdateError('');

      if (!user || !user.token) {
        setUpdateError('You must be logged in to edit crops.');
        return;
      }

      // Additional check to ensure only the crop owner can edit
      if (user.id !== crop?.seller?._id) {
        setUpdateError('You can only edit your own crops.');
        return;
      }

      try {
        const response = await fetch(`https://s85-aman-capstone-anndhara-1-8beh.onrender.com/crop/update/${crop._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`
          },
          body: JSON.stringify(editFormData)
        });

        const data = await response.json();

        if (data.success) {
          setCrop(data.data);
          setIsEditing(false);
          setUpdateMessage('Crop updated successfully!');
          setTimeout(() => setUpdateMessage(''), 3000);
        } else {
          setUpdateError(data.message || 'Failed to update crop');
        }
      } catch (error) {
        console.error('Error updating crop:', error);
        setUpdateError('An error occurred while updating the crop');
      }
    };

    const handleInputChange = (e) => {
      const { name, value, type, checked } = e.target;
      setEditFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    };

    useEffect(() => {
      if (!farmer?._id) return;

      const fetchRatings = async () => {
        setLoadingRatings(true);
        try {
          const res = await fetch(`https://s85-aman-capstone-anndhara-1-8beh.onrender.com/rating/getReview`);
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
        const res = await fetch(`https://s85-aman-capstone-anndhara-1-8beh.onrender.com/rating/Review`, {
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
    const handleDeleteCrop = async () => {
      setDeleteMessage('');
      setDeleteError('');
    
      if (!user || !user.token) {
        setDeleteError('You must be logged in to delete crops.');
        return;
      }
    
      if (user.id !== crop?.seller?._id) {
        setDeleteError('You can only delete your own crops.');
        return;
      }
    
      try {
          const response = await fetch(`https://s85-aman-capstone-anndhara-1-8beh.onrender.com/crop/delete/${crop._id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${user.token}`,
              'Content-Type': 'application/json'
            }
          });
    
        // Always try to parse as JSON first
        let responseData;
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          responseData = await response.json();
        } else {
          // If not JSON, get text and try to extract meaningful error
          const textData = await response.text();
          responseData = { 
            success: false, 
            message: textData.includes('Cannot DELETE') ? 
              'Delete endpoint not found. Please check server configuration.' : 
              textData 
          };
        }
    
        // Check if response is OK (status 200-299)
        if (!response.ok) {
          throw new Error(responseData.message || `HTTP ${response.status}: Failed to delete crop`);
        }
    
        // Check if the operation was successful
        if (responseData.success === false) {
          throw new Error(responseData.message || 'Failed to delete crop');
        }
    
        setDeleteMessage('Crop deleted successfully! Redirecting...');
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } catch (error) {
        console.error('Error deleting crop:', error);
        setDeleteError(error.message || 'Failed to delete crop. Please try again.');
      }
      setShowDeleteConfirm(false);
    };
    const handleDeleteConfirm = () => {
      setShowDeleteConfirm(true);
      setDeleteMessage('');
      setDeleteError('');
    };

    const handleDeleteCancel = () => {
      setShowDeleteConfirm(false);
      setDeleteMessage('');
      setDeleteError('');
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

        <div className="bg-white p-6 rounded-lg shadow-lg">
          {/* Edit and Delete buttons - only shown if user is the crop owner */}
          {user && user.role === 'farmer' && user.id === crop?.seller?._id && (
            <div className="mb-4 flex justify-end space-x-3">
              <button
                onClick={handleEditToggle}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  isEditing 
                    ? 'bg-gray-500 text-white hover:bg-gray-600' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isEditing ? '✕ Cancel Edit' : '✏️ Edit Crop'}
              </button>
              {!isEditing && (
                <button
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 rounded-lg font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors"
                >
                  🗑️ Delete Crop
                </button>
              )}
            </div>
          )}

          {/* Update messages */}
          {updateMessage && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
              {updateMessage}
            </div>
          )}
          {updateError && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {updateError}
            </div>
          )}

          {/* Delete messages */}
          {deleteMessage && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
              {deleteMessage}
            </div>
          )}
          {deleteError && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {deleteError}
            </div>
          )}

          {/* Delete confirmation modal */}
          {showDeleteConfirm && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-400 rounded-lg">
              <h4 className="text-lg font-semibold text-yellow-800 mb-2">⚠️ Confirm Delete</h4>
              <p className="text-yellow-700 mb-4">
                Are you sure you want to delete this crop? This action cannot be undone.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={handleDeleteCrop}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition-colors"
                >
                  Yes, Delete
                </button>
                <button
                  onClick={handleDeleteCancel}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {isEditing ? (
            /* Edit Form */
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="flex items-start space-x-6">
                <div className="flex-shrink-0">
                  {crop.imageData && crop.imageContentType ? (
                    <img
                      src={`data:${crop.imageContentType};base64,${crop.imageData}`}
                      alt={crop.name}
                      className="w-48 h-48 object-cover rounded-lg border border-gray-300"
                    />
                  ) : (
                    <div className="w-48 h-48 bg-gray-200 rounded-lg flex items-center justify-center border border-gray-300">
                      <span className="text-gray-500">No Image</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Crop Name</label>
                    <input
                      type="text"
                      name="name"
                      value={editFormData.name}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <input
                      type="text"
                      name="type"
                      value={editFormData.type}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Price per Kg (₹)</label>
                      <input
                        type="number"
                        name="pricePerKg"
                        value={editFormData.pricePerKg}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Quantity (kg)</label>
                      <input
                        type="number"
                        name="quantityKg"
                        value={editFormData.quantityKg}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input
                      type="text"
                      name="location"
                      value={editFormData.location}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="available"
                      id="available"
                      checked={editFormData.available}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <label htmlFor="available" className="ml-2 block text-sm text-gray-700">
                      Available for sale
                    </label>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 font-semibold transition-colors"
                    >
                      💾 Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={handleEditToggle}
                      className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 font-semibold transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </form>
          ) : (
            /* Display Mode */
            <div className="flex items-start space-x-6">
              <div className="flex-shrink-0">
                {crop.imageData && crop.imageContentType ? (
                  <img
                    src={`data:${crop.imageContentType};base64,${crop.imageData}`}
                    alt={crop.name}
                    className="w-48 h-48 object-cover rounded-lg border border-gray-300"
                  />
                ) : (
                  <div className="w-48 h-48 bg-gray-200 rounded-lg flex items-center justify-center border border-gray-300">
                    <span className="text-gray-500">No Image</span>
                  </div>
                )}
              </div>

              <div className="flex-1">
                <h2 className="text-2xl font-bold text-green-800 mb-2">{crop.name}</h2>
                <p className="text-gray-600 mb-2"><strong>Type:</strong> {crop.type}</p>
                <p className="text-gray-600 mb-2"><strong>Price per Kg:</strong> ₹{crop.pricePerKg}</p>
                <p className="text-gray-600 mb-2"><strong>Available Quantity:</strong> {crop.quantityKg} kg</p>
                <p className="text-gray-600 mb-2"><strong>Location:</strong> {crop.location}</p>
                <p className="text-gray-600 mb-4">
                  <strong>Status:</strong>
                  <span className={`ml-2 px-2 py-1 rounded text-sm ${
                    crop.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {crop.available ? 'Available' : 'Not Available'}
                  </span>
                </p>
              </div>
            </div>
          )}

          <div className="mt-6">
            <h3 className="text-lg font-semibold text-green-800">Farmer Info</h3>
            {loadingFarmer ? (
              <p className="text-gray-500">Loading farmer details...</p>
            ) : farmer ? (
              <>
                <p><strong>Name:</strong> {farmer.username}</p>
                <p><strong>Email:</strong> {farmer.email}</p>
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