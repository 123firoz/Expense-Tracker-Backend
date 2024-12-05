const mongoose = require('mongoose')
require("dotenv").config();

mongoose.connect(process.env.MONGO_URI)

// create scehma 
const userSchema = new mongoose.Schema({
    username:String,
    email:String,
    password:String,
    age:Number,
})

module.exports = mongoose.model('User',userSchema)