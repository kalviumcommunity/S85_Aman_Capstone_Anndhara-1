const express = require('express');
const router = express.Router();
const { userCreatePost, userCreateGet, userCreatePut,userLoginPost } = require('../Controller/user')
const middleware=require('../middleware/verifyToken')
const passport = require("../auth");
const verifyToken = require('../middleware/verifyToken');


const localAuthMiddleware=passport.authenticate('local', { session: false });
router.post('/register', userCreatePost);
router.post('/login',userLoginPost);
// router.get('/', localAuthMiddleware, userCreateGet);
router.get('/', userCreateGet);
router.put('/update/:id', userCreatePut);
router.get('/me', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const user = await require('../model/user').findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});


module.exports = router;