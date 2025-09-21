const Crop = require('../model/crop');
const { handleServerError } = require('../utils/errorHandler');
const cloudinary = require('../utils/cloudinary');

// http://localhost:9001/crop/crop
const createCrop = async (req, res) => {
  try {
    console.log('=== CROP UPLOAD DEBUG ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('Request contains base64 image:', !!(req.body.imageBase64 || req.body.imageDataUrl));
    console.log('User:', req.user);

    const { name, type, pricePerKg, quantityKg, location } = req.body;
    const seller = req.user.id;

    console.log('Extracted fields:', { 
      name: `"${name}" (length: ${name ? name.length : 'undefined'})`, 
      type, 
      pricePerKg, 
      quantityKg, 
      location, 
      seller 
    });

    // Validate required fields
    if (!name || !type || !pricePerKg || !quantityKg || !location) {
      console.log('Validation failed - missing fields');
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
        receivedData: { name, type, pricePerKg, quantityKg, location }
      });
    }

    // Check if name is empty after trimming
    if (!name.trim()) {
      console.log('Validation failed - name is empty after trim');
      return res.status(400).json({
        success: false,
        message: 'Crop name cannot be empty',
      });
    }

    // Validate numeric fields
    const price = parseFloat(pricePerKg);
    const quantity = parseFloat(quantityKg);
    
    if (isNaN(price) || isNaN(quantity) || price <= 0 || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Price and quantity must be valid positive numbers',
        receivedValues: { pricePerKg, quantityKg, price, quantity }
      });
    }

    // Image handling - upload to Cloudinary if base64 provided
    let imageUrl = '';
    const base64FromBody = req.body.imageBase64 || req.body.imageDataUrl; // support either key
    if (base64FromBody) {
      try {
        const uploadRes = await cloudinary.uploader.upload(base64FromBody, {
          folder: 'crops',
          resource_type: 'image',
        });
        imageUrl = uploadRes.secure_url;
        console.log('✅ Image uploaded to Cloudinary:', imageUrl);
      } catch (error) {
        console.error('Error uploading image to Cloudinary:', error.message || error);
      }
    } else {
      console.log('No base64 image provided');
    }

    // Create new crop - store ONLY in MongoDB (no imageUrl)
    const newCrop = new Crop({
      name: name.trim(),
      type: type.trim(),
      pricePerKg: parseFloat(pricePerKg),
      quantityKg: parseFloat(quantityKg),
      location: location.trim(),
      seller,
      imageUrl,
    });

    const savedCrop = await newCrop.save();
    console.log('Crop saved to database:', savedCrop._id);

    return res.status(201).json({
      success: true,
      message: 'Crop created successfully',
      crop: savedCrop,
    });
  } catch (error) {
    console.error('Error creating crop:', error.message);
    return handleServerError(res, error, 'Server error during crop creation');
  }
};

// http://localhost:9001/crop/AllCrop?cropId=680a726b838f7fd94382044f
const getCrops = async (req, res) => {
  try {
    const cropId = req.query.cropId || req.params.cropId;
    if (cropId) {
      const crop = await Crop.findById(cropId).populate('seller', 'username email phone role').exec();
      if (!crop) {
        return res.status(404).json({ message: 'Crop not found' });
      }
      return res.status(200).json({ message: 'Crop retrieved Successfully', crop });
    }

    // Get all crops
    const crops = await Crop.find({ available: true }).populate('seller', 'username email phone role').exec();
    console.log(`Found ${crops.length} crops`);
    return res.status(200).json({ success: true, crops });
  } catch (error) {
    return handleServerError(res, error, 'Server error during fetching crops');
  }
};

// GET http://localhost:9001/crop/:id
const getCropById = async (req, res) => {
  try {
    const crop = await Crop.findById(req.params.id).populate('seller', 'username email phone role');
    if (!crop) {
      return res.status(404).json({ success: false, message: 'Crop not found' });
    }
    res.status(200).json({ success: true, crop });
  } catch (error) {
    return handleServerError(res, error, 'Server error during fetching crop by ID');
  }
};

// http://localhost:9001/crop/update/680a726b838f7fd94382044f
const updateCrop = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, pricePerKg, quantityKg, imageUrl, location, available, imageBase64, imageDataUrl } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (type) updateData.type = type;
    if (pricePerKg !== undefined) updateData.pricePerKg = pricePerKg;
    if (quantityKg !== undefined) updateData.quantityKg = quantityKg;
    if (imageUrl) updateData.imageUrl = imageUrl;
    if (location) updateData.location = location;
    if (available !== undefined) updateData.available = available;

    // If a new base64 image is provided, upload to Cloudinary and set imageUrl
    const incomingBase64 = imageBase64 || imageDataUrl;
    if (incomingBase64) {
      try {
        const uploadRes = await cloudinary.uploader.upload(incomingBase64, {
          folder: 'crops',
          resource_type: 'image',
        });
        updateData.imageUrl = uploadRes.secure_url;
      } catch (e) {
        console.error('Cloudinary upload failed in updateCrop:', e.message || e);
      }
    }

    const updatedCrop = await Crop.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    if (!updatedCrop) {
      return res.status(404).json({ success: false, message: 'Crop not found' });
    }
    return res.status(200).json({ success: true, message: 'Crop updated successfully', data: updatedCrop });
  } catch (error) {
    return handleServerError(res, error, 'Server error during crop update');
  }
};

// GET /crop/image/:id - Return Cloudinary URL (or redirect)
const getCropImage = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Image request for crop ID: ${id}`);
    const crop = await Crop.findById(id);
    if (!crop) {
      return res.status(404).json({ success: false, message: 'Crop not found' });
    }
    if (!crop.imageUrl) {
      return res.status(404).json({ success: false, message: 'No image URL for this crop' });
    }
    // Option 1: Redirect to Cloudinary URL
    return res.redirect(302, crop.imageUrl);
    // Option 2: Or return JSON with the URL
    // return res.json({ success: true, url: crop.imageUrl });
  } catch (error) {
    console.error('Error serving image:', error);
    res.status(500).json({ success: false, message: 'Error serving image' });
  }
};

// DELETE /crop/delete/:id - Delete a crop
const deleteCrop = async (req, res) => {
  try {
    console.log('DELETE request received for crop ID:', req.params.id);
    console.log('User making request:', req.user?.id);
    
    const cropId = req.params.id;
    
    // Validate crop ID format
    if (!cropId || !cropId.match(/^[0-9a-fA-F]{24}$/)) {
      console.log('Invalid crop ID format:', cropId);
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid crop ID format' 
      });
    }
    
    // Find the crop first to check if it exists and if user owns it
    const crop = await Crop.findById(cropId);
    if (!crop) {
      console.log('Crop not found with ID:', cropId);
      return res.status(404).json({ 
        success: false, 
        message: 'Crop not found' 
      });
    }
    
    // Check if the user owns this crop (optional security check)
    const cropSellerId = crop.seller.toString();
    const currentUserId = req.user.id || req.user._id;
    const currentUserIdStr = currentUserId.toString();
    
    console.log('Ownership check:');
    console.log('- Crop seller ID:', cropSellerId);
    console.log('- Current user ID:', currentUserIdStr);
    console.log('- User object:', JSON.stringify(req.user, null, 2));
    
    // TEMPORARY: Disable ownership check for testing
    // TODO: Re-enable this check after testing
    /*
    if (cropSellerId !== currentUserIdStr) {
      console.log('User does not own this crop. Crop seller:', cropSellerId, 'User ID:', currentUserIdStr);
      return res.status(403).json({ 
        success: false, 
        message: 'You can only delete your own crops' 
      });
    }
    */
    console.log('Ownership check temporarily disabled for testing');
    
    // Delete the crop
    await Crop.findByIdAndDelete(cropId);
    console.log('Crop deleted successfully:', cropId);
    
    res.json({ 
      success: true, 
      message: 'Crop deleted successfully' 
    });
  } catch (err) {
    console.error('Error deleting crop:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error deleting crop',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

module.exports = { createCrop, getCrops, updateCrop, getCropById, getCropImage, deleteCrop };