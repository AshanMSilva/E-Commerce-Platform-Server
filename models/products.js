const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// require('mongoose-currency').loadType(mongoose);

var attributeSchema = new Schema({
    name:{
        type: String,
        required: true
    },
    value:{
        type: String
       
    }
},{
    timestamps: true
});

var varientSchema = new Schema({
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


var productSchema = new Schema({
    brand:{
        type: String,
        required:true
    },
    name: {
        type: String,
        required: true
    },
    image: {
        type: String
    },
    varients: [varientSchema],
    sales: {
        type: Number, 
        default: 0
    }
}, {
    timestamps: true
});


var Products = mongoose.model('Product', productSchema);

module.exports = Products;