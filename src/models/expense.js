const mongoose = require('mongoose')

// Schema and Models
const expenseSchema = new mongoose.Schema({
    name: {type: String, required: true},
    amount:{type: Number, required: true},
    cratedAt:{type: Date,default: Date.now},
});

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true },
    totalAmount:{type:Number,default:0},
    cratedAt:{type: Date,default: Date.now},   
    expenses: [expenseSchema]
});

module.exports = mongoose.model('Category', categorySchema);


