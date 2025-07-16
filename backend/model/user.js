const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true
    },
    photo: {
        type: String
    },
    role: {
        type: String,
        enum: ['farmer', 'buyer'],
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    profileImage: String,
    googleId:{
        type:String,
        unique:true,
        sparse:true,
    },

}, { timestamps: true });


userSchema.pre('save', async function (next) {
    const person = this;

    //hash password only if it has been modified (or is new)
    if (!person.isModified('password')) return next();
    try {
        //hash password generation
        const salt = await bcrypt.genSalt(10);

        person.password = await bcrypt.hash(person.password, salt);


        next();
    } catch (error) {
        return next(error);
    }

})



userSchema.methods.comparePassword = async function (candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);



    } catch (error) {
        throw error;
    }
}
module.exports = mongoose.model('User', userSchema);