const mongoose = require('mongoose')
const connect = async () => {
    const Url = process.env.DB_URL;
    if (!Url) {
        // console.error('Database connection failed :DB_URl is not defined in the environment variables');
        process.exit(1);
    }


    await mongoose.connect(Url).then(() => {
        // console.log('MongoDB Connected');
    }).catch((error) => {
        // console.error('MongoDB Not Connected', error.message);
        process.exit(1);

    })

 
}
module.exports = { connect };