const mongoose = require('mongoose');

const historicalDataSchema = new mongoose.Schema({
    date:{type: Date},
    adjClose:{type: Number},
    name:{type: String, default: 'Stock'}
})

const historicalGoogleSchema = new mongoose.Schema({
    formattedAxisTime:{type: Date},
    value:{
        type: [Number]
    },
    name:{type:String, default: 'Google'}
})

const stockSchema = new mongoose.Schema({
    symbol: {
        type: String,
        required: true,
        max: 255
    },
    historicalStock: {
        type: [historicalDataSchema],
        required: true,
    },
    historicalGoogle: {
        type: [historicalGoogleSchema],
        required: true
    },
    date:{
        type: Date,
        default: Date.now()
    }
});


module.exports = mongoose.model('Stock', stockSchema);