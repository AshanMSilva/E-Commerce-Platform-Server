const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// require('mongoose-currency').loadType(mongoose);

var attributeSchema = new Schema({
    name:{
        type: String,
        required: true
    },
    value:{
        type: String,
        required: true
    }
},{
    timestamps: true
});

var varientSchema = new Schema({
    name:{
        type: String,
        required:true
    },
    price: {
        type: Number,
        required: true
    },
    availability:{
        type: Number,
        required: true
    },
    attributes: [attributeSchema],
    sales: {
        type: Number, 
        default: 0
    }
}, {
    timestamps: true
});


var Varients = mongoose.model('Varient', varientSchema);

module.exports = Varients;