const express=require('express');
const router=express.Router();
const upload=require('../utils/multer.js');
const verifyToken=require('../middleware/verifyToken');
const verifyFarmer=require('../middleware/verifyFarmer');
const{createCrop,getCrops,updateCrop,getCropById}=require('../Controller/crop')
router.post('/crop',verifyToken,verifyFarmer,upload.single('image'),createCrop);
router.get('/AllCrop',getCrops);
router.get('/AllCrop/:cropId',getCrops);
router.put('/update/:id',verifyToken,updateCrop);
router.get('/:id', getCropById);


module.exports=router;