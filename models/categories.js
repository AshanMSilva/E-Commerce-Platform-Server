const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// require('mongoose-currency').loadType(mongoose);
// const Currency = mongoose.Types.Currency;

var categorySchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    image: {
        type: String
    },
    subCategories: [{
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Category'
    }],
    products: [{
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Product'
    }],
    topCategory: {
        type: Boolean, 
        default: true
    }
}, {
    timestamps: true
});


var Categories = mongoose.model('Category', categorySchema);

module.exports = Categories;