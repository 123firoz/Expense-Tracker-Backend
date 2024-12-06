require("dotenv").config();
const mongoose = require('mongoose')

mongoose.connect(process.env.MONGO_URI)

// create scehma 
const userSchema = new mongoose.Schema({
    username:String,
    email:String,
    password:String,
})

module.exports = mongoose.model('User',userSchema)