const express=require('express');
const router=express.Router();
const upload=require('../utils/multer.js');
const verifyToken=require('../middleware/verifyToken');
const verifyFarmer=require('../middleware/verifyFarmer');
const{createCrop,getCrops,updateCrop,getCropById,getCropImage,deleteCrop}=require('../Controller/crop')

// Debug middleware to log all requests to crop routes
router.use((req, res, next) => {
  console.log(`[CROP ROUTER] ${req.method} ${req.originalUrl} - ${new Date().toISOString()}`);
  console.log(`[CROP ROUTER] Headers:`, req.headers.authorization ? 'Token present' : 'No token');
  next();
});

// Multer error handling middleware
const handleMulterError = (err, req, res, next) => {
  if (err) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 5MB.',
      });
    }
    if (err.message === 'Only image files are allowed!') {
      return res.status(400).json({
        success: false,
        message: 'Only image files are allowed.',
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message || 'File upload error',
    });
  }
  next();
};

router.post('/crop',verifyToken,verifyFarmer,upload.single('image'),handleMulterError,createCrop);
router.get('/AllCrop',getCrops);
router.get('/AllCrop/:cropId',getCrops);
router.put('/update/:id',verifyToken,upload.single('image'),handleMulterError,updateCrop);
router.get('/image/:id', getCropImage); // New endpoint to serve images from MongoDB
router.delete('/delete/:id',verifyToken,deleteCrop);
router.get('/:id', getCropById);

module.exports=router;