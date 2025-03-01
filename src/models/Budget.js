const mongoose = require('mongoose');

const budgetCategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    budgeted: {
        type: Number,
        default: 0
    },
    activity: {
        type: Number,
        default: 0
    },
    available: {
        type: Number,
        default: 0
    }
});

const budgetGroupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    categories: [budgetCategorySchema]
});

const budgetSchema = new mongoose.Schema({
    month: {
        type: Date,
        required: true
    },
    readyToAssign: {
        type: Number,
        default: 0
    },
    groups: [budgetGroupSchema]
}, { 
    timestamps: true,
    // Add this to see the data in console.log
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Add this to verify the model is created
const Budget = mongoose.model('Budget', budgetSchema);
console.log('✅ Budget model registered');

module.exports = Budget; 