const User = require('../model/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')
require('dotenv').config();
const { handleServerError } = require('../utils/errorHandler');
// http://localhost:9001/user/register
const userCreatePost = async (req, res) => {
    try {
        const { username, email, password, photo, role, phone } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({
                message: 'Username, email and password are required!',
                missingFields: {
                    username: !username ? 'Username is required' : undefined,
                    email: !email ? 'Email is required' : undefined,
                    password: !password ? 'Password is required' : undefined,
                },
            });
        }
        const newUser = new User({
            username, email, password, photo, role, phone
        });

        await newUser.save();
        const payload = {
            id: newUser._id,
            email: newUser.email,
            role: newUser.role,
        };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });
        
        // Return user data without password
        const userResponse = {
            _id: newUser._id,
            username: newUser.username,
            email: newUser.email,
            role: newUser.role,
            phone: newUser.phone,
            createdAt: newUser.createdAt
        };
        
        return res.status(201).json({ 
            message: 'User is created successfully!', 
            success: true, 
            user: userResponse, 
            token 
        });
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
        console.log('Login attempt:', { email: req.body.email, hasPassword: !!req.body.password });
        
        const { email, password } = req.body;
        if (!email || !password) {
            console.log('Missing email or password');
            return res.status(400).json({ success: false, message: 'Email and password are required' })
        }
        
        // Check if JWT_SECRET exists
        if (!process.env.JWT_SECRET) {
            console.error('JWT_SECRET is not defined in environment variables');
            return res.status(500).json({ success: false, message: 'Server configuration error' });
        }
        
        const emailExist = await User.findOne({ email });
        if (!emailExist) {
            console.log('User not found with email:', email);
            return res.status(401).json({ success: false, message: 'Invalid credentials' })
        }
        
        console.log('User found, comparing passwords...');
        const isMatch = await bcrypt.compare(password, emailExist.password);
        if (!isMatch) {
            console.log('Password mismatch for user:', email);
            return res.status(401).json({ success: false, message: 'Invalid credentials' })
        }
        
        const payload = {
            id: emailExist._id,
            email: emailExist.email,
            role: emailExist.role,
        }
        
        console.log('Generating JWT token...');
        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        )

        // Return user data without password
        const userResponse = {
            _id: emailExist._id,
            username: emailExist.username,
            email: emailExist.email,
            role: emailExist.role,
            phone: emailExist.phone,
            createdAt: emailExist.createdAt
        };

        console.log('Login successful for user:', email);
        return res.status(200).json({ 
            message: 'Login successful!', 
            success: true, 
            data: userResponse, 
            token 
        })
    } catch (error) {
        console.error('Login error:', error);
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
    const { username, email, password, photo, role, phone } = req.body;
    try {
        const { id } = req.params;
        if (!username && !email && !password && !photo && !role && !phone) {
            return res.status(400).json({
                message: 'At least one field is required to update',
                success: false,
            });
        }
        const updateData = {};
        if (username) updateData.username = username;
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