const mongoose = require('mongoose');
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://nandhiniannikalla322005:ius3b1DqJo3XnePQ@cluster0.gpzk2sp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const connectToMongo = async()=>{
    mongoose.connect(mongoURI);
    console.log("Successfully connected to database")
}

module.exports = connectToMongo;