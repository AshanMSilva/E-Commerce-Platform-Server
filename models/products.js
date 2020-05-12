const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// require('mongoose-currency').loadType(mongoose);


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
    varients: [{
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Varient'
    }],
    sales: {
        type: Number, 
        default: 0
    }
}, {
    timestamps: true
});


var Products = mongoose.model('Product', productSchema);

module.exports = Products;