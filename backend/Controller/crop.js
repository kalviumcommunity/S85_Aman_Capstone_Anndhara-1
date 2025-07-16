const Crop = require('../model/crop');
const { handleServerError } = require('../utils/errorHandler');
// http://localhost:9001/crop/crop
const createCrop = async (req, res) => {
  try {
    const { name, type, pricePerKg, quantityKg, location } = req.body;
    const seller = req.user.id;

    // Validate required fields
    if (!name || !type || !pricePerKg || !quantityKg || !location) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
    }

    // Image handling
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : '';

    // Create new crop
    const newCrop = new Crop({
      name,
      type,
      pricePerKg,
      quantityKg,
      location,
      seller,
      imageUrl,
    });

    await newCrop.save();

    return res.status(201).json({
      success: true,
      message: 'Crop created successfully',
      crop: newCrop,
    });
  } catch (error) {
    // console.error('Error creating crop:', error.message);
    return handleServerError(res, error, 'Server error during crop creation');
  }
};

// http://localhost:9001/crop/AllCrop?cropId=680a726b838f7fd94382044f
const getCrops = async (req, res) => {
    try {

        const  cropId  = req.query.cropId||req.params.cropId;
        if (cropId) {
            const crop = await Crop.findById(cropId).populate('seller', 'username email phone role').exec();
            if (!crop) {
                return res.status(404).json({ message: 'Crop not found' });
            }
            return res.status(200).json({ message: 'Crop retrieved Successfully', crop })
        }

        // all Crop
        const crops = await Crop.find().populate('seller', 'username email phone role').exec();
        return res.status(200).json({ message: 'Crop retrieved Successfully', crops })
    } catch (error) {
        // console.error('Error fetching crops:', error);
        return handleServerError(res, error, 'Server error during fetching crops');
    }
}
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
module.exports = {
    createCrop,
    getCrops,
    updateCrop,
    getCropById
}