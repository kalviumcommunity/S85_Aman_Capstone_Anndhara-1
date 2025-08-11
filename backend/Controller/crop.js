const Crop = require('../model/crop');
const { handleServerError } = require('../utils/errorHandler');
// http://localhost:9001/crop/crop
const createCrop = async (req, res) => {
  try {
    console.log('=== CROP UPLOAD DEBUG ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('Request file:', req.file ? {
      fieldname: req.file.fieldname,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path
    } : 'No file');
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

    // Image handling - store ONLY in MongoDB as Base64
    let imageData = '';
    let imageContentType = '';
    
    if (req.file) {
      try {
        // Convert image to Base64 for MongoDB storage
        const fs = require('fs');
        const imageBuffer = fs.readFileSync(req.file.path);
        imageData = imageBuffer.toString('base64');
        imageContentType = req.file.mimetype;
        
        console.log('✅ Image stored in MongoDB as Base64:', req.file.filename);
        
        // Delete the temporary file since we're storing in MongoDB
        fs.unlinkSync(req.file.path);
      } catch (error) {
        console.error('Error processing image:', error);
        // Continue without image if processing fails
      }
    } else {
      console.log('No image file provided');
    }

    // Create new crop - store ONLY in MongoDB (no imageUrl)
    const newCrop = new Crop({
      name: name.trim(),
      type: type.trim(),
      pricePerKg: parseFloat(pricePerKg),
      quantityKg: parseFloat(quantityKg),
      location: location.trim(),
      seller,
      imageData,
      imageContentType,
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
    
    // Handle multer errors
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 5MB.',
      });
    }
    
    if (error.message === 'Only image files are allowed!') {
      return res.status(400).json({
        success: false,
        message: 'Only image files are allowed.',
      });
    }
    
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

        // Get all crops and include Base64 image data for direct display
        const crops = await Crop.find({ available: true }).populate('seller', 'username email phone role').exec();
        
        console.log(`Found ${crops.length} crops`);
        
        // Convert image data to data URL for direct display in frontend
        const cropsWithImages = crops.map(crop => {
            const cropObj = crop.toObject();
            console.log(`Processing crop ${cropObj._id}: hasImageData=${!!cropObj.imageData}, imageContentType=${cropObj.imageContentType}`);
            
            if (cropObj.imageData && cropObj.imageContentType) {
                cropObj.imageDataUrl = `data:${cropObj.imageContentType};base64,${cropObj.imageData}`;
                console.log(`✅ Created imageDataUrl for crop ${cropObj._id}, length: ${cropObj.imageDataUrl.length}`);
            } else {
                console.log(`❌ No image data for crop ${cropObj._id}`);
            }
            return cropObj;
        });
        
        console.log(`Sending ${cropsWithImages.length} crops with images to frontend`);
        return res.status(200).json({ success: true, crops: cropsWithImages });
    } catch (error) {
        return handleServerError(res, error, 'Server error during fetching crops');
    }
};

// GET http://localhost:9001/crop/:id
const getCropById = async (req, res) => {
  try {
    const crop = await Crop.findById(req.params.id).populate('seller', 'user email phone role');
    if (!crop) {
      return res.status(404).json({ success: false, message: 'Crop not found' });
    }
    res.status(200).json({ success: true, crop });
  } catch (error) {
    // console.error('Error fetching crop by ID:', error.message);
    return handleServerError(res, error, 'Server error during fetching crop by ID');
  }
};

// http://localhost:9001/crop/update/680a726b838f7fd94382044f
const updateCrop = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, type, pricePerKg, quantityKg, imageUrl, location, available } = req.body;

        const updateData = {};
        if (name) updateData.name = name;
        if (type) updateData.type = type;
        if (pricePerKg !== undefined) updateData.pricePerKg = pricePerKg;
        if (quantityKg !== undefined) updateData.quantityKg = quantityKg;
        if (imageUrl) updateData.imageUrl = imageUrl;
        if (location) updateData.location = location;
        if (available !== undefined) updateData.available = available;

        const updatedCrop = await Crop.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
        if (!updatedCrop) {
            return res.status(404).json({ success: false, message: 'Crop not found' });
        }
        return res.status(200).json({ success: true, message: 'Crop updated successfully', data: updatedCrop });
    } catch (error) {
        return handleServerError(res, error, 'Server error during crop update');
    }
};

// GET /crop/image/:id - Serve image from MongoDB
const getCropImage = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Image request for crop ID: ${id}`);
    
    const crop = await Crop.findById(id);
    console.log(`Crop found: ${!!crop}, Has imageData: ${!!(crop && crop.imageData)}`);
    
    if (!crop) {
      console.log('Crop not found');
      return res.status(404).json({ success: false, message: 'Crop not found' });
    }
    
    if (!crop.imageData) {
      console.log('No image data for crop');
      return res.status(404).json({ success: false, message: 'No image data for this crop' });
    }
    
    // Convert Base64 back to buffer and send as image
    const imageBuffer = Buffer.from(crop.imageData, 'base64');
    console.log(`Serving image: ${crop.imageContentType}, size: ${imageBuffer.length} bytes`);
    
    // Set CORS headers for image serving
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    res.setHeader('Content-Type', crop.imageContentType || 'image/jpeg');
    res.setHeader('Content-Length', imageBuffer.length);
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
    
    res.send(imageBuffer);
  } catch (error) {
    console.error('Error serving image:', error);
    res.status(500).json({ success: false, message: 'Error serving image' });
  }
};

module.exports = { createCrop, getCrops, updateCrop, getCropById, getCropImage };