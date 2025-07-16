const express=require('express');
const router=express.Router();
const{createReview,getReviews,putReviews}=require('../Controller/rating')

router.post('/Review',createReview);


router.get('/getReview',getReviews);

router.put('/update/:id',putReviews);




module.exports=router;