const express=require('express');
const router=express.Router();
const verifyToken=require('../middleware/verifyToken');
const verifyFarmer=require('../middleware/verifyFarmer');
const{createCrop,getCrops,updateCrop,getCropById,getCropImage,deleteCrop}=require('../Controller/crop')

// Debug middleware to log all requests to crop routes
router.use((req, res, next) => {
  console.log(`[CROP ROUTER] ${req.method} ${req.originalUrl} - ${new Date().toISOString()}`);
  console.log(`[CROP ROUTER] Headers:`, req.headers.authorization ? 'Token present' : 'No token');
  next();
});

router.post('/crop',verifyToken,verifyFarmer,createCrop);
router.get('/AllCrop',getCrops);
router.get('/AllCrop/:cropId',getCrops);
router.put('/update/:id',verifyToken,updateCrop);
router.get('/image/:id', getCropImage); // New endpoint to serve images from MongoDB
router.delete('/delete/:id',verifyToken,deleteCrop);
router.get('/:id', getCropById);

module.exports=router;