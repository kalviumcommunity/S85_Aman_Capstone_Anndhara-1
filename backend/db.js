const mongoose = require('mongoose')
const connect = async () => {
    const Url = process.env.DB_URL || 'mongodb://localhost:27017/farmconnect';
     
    try {
        await mongoose.connect(Url);
        console.log('✅ MongoDB Connected successfully');
    } catch (error) {
        console.error('❌ MongoDB Connection failed:', error.message);
        console.log('💡 Make sure MongoDB is running on your system');
        console.log('💡 You can install MongoDB from: https://www.mongodb.com/try/download/community');
        // Don't exit process, let the application handle the error gracefully
        throw error;
    }
}
module.exports = { connect };