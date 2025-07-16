const User = require('../model/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')
require('dotenv').config();
const { handleServerError } = require('../utils/errorHandler');
// http://localhost:9001/user/register
const userCreatePost = async (req, res) => {
    try {
        const { username, email, password, photo, role, phone } = req.body;
        if (!username || !email || !password || !phone) {
            return res.status(400).json({
                message: 'All fields are required!',
                missingFields: {
                    username: !username ? 'User is required' : undefined,
                    email: !email ? 'Email is required' : undefined,
                    password: !password ? 'Password is required' : undefined,
                    phone: !phone ? 'Phone is required' : undefined,
                },
            });
        }
        const newUser = new User({
            username, email, password, photo, role: role || '', phone
        });

        await newUser.save();
        const payload = {
            id: newUser._id,
            email: newUser.email,
            role: newUser.role,
        };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });
        return res.status(201).json({ message: 'User is created successfully!', success: true, data: newUser, token });
    }
    catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "Email Already  is Use. Please Try loggin in or use a different email."
            })
        }
        return handleServerError(res, error, 'Server error during creating the user.');
    }
}
// login  
const userLoginPost = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'All Field required' })
        }
        const emailExist = await User.findOne({ email });
        if (!emailExist) {
            return res.status(401).json({ message: 'Invalid Credentials' })
        }
        const isMatch = await bcrypt.compare(password, emailExist.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid Credentials', success: false })
        }
        const payload = {
            id: emailExist._id,
            email: emailExist.email,
            role: emailExist.role,
        }
        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        )


        return res.status(200).json({ message: 'Login Successfull!', success: true, data: emailExist, token })
    } catch (error) {
        return handleServerError(res, error, 'Server error during login');
    }

}

// http://localhost:9001/user
const userCreateGet = async (req, res) => {
    try {
        // const { username, password } = req.query;
        // if (username && password) {
        //     const user1 = await User.findOne({ username, password });
        //     if (!user1) {
        //         return res.status(404).json({
        //             message: 'User not found with the provided credentials',
        //             success: false,
        //             data: null,
        //         })
        //     }
        //     return res.status(200).json({ message: 'User is found', success: true, data: user1 });
        // }
        const { id } = req.params;
        if (id) {
            const user = await User.findById(id);
            if (!user) {
                return res.status(404).json({
                    message: 'User not found with the provided ID',
                    success: false,
                    data: null,
                });
            }
            return res.status(200).json({
                message: 'User fetched successfully!',
                success: true,
                data: user,
            });
        }
        const user = await User.find({});
        return res.status(200).json({
            message: 'User fetched sucessfully! ',
            success: true,
            farmer:user,
            data: user,
        });
    } catch (error) {
        return handleServerError(res, error, 'Server error occurred while fetching Users.');
    }

}
//http://localhost:9001/user/update/680b7ef2d2de61db25949891
const userCreatePut = async (req, res) => {
    const { user, email, password, photo, role, phone } = req.body;
    try {
        const { id } = req.params;
        if (!user && !email && !password && !photo && !role && !phone) {
            return res.status(400).json({
                message: 'At least one field is required to updates',
                success: false,
            });
        }
        const updateData = {};
        if (user) updateData.user = user;
        if (email) updateData.email = email;
        if (password) updateData.password = password;
        if (photo) updateData.photo = photo;
        if (role) updateData.role = role;
        if (phone) updateData.phone = phone;


        const updatedUser = await User.findByIdAndUpdate(id, updateData, { new: true, runValidators: true, select: '-password' });

        if (!updatedUser) {
            return res.status(404).json({
                message: 'User is not found!',
                success: false,


            });
        }

        return res.status(200).json({
            message: 'User Update Sucessfully!',
            success: true,
            data: updatedUser,
        })
    } catch (error) {
        return handleServerError(res, error, 'Server error occurred while updating user.');
    }
}


module.exports = {
    userCreatePost,
    userCreateGet,
    userCreatePut,
    userLoginPost
}