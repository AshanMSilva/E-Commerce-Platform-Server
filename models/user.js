var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');

var addressSchema = new Schema({
    houseNumber:{
        type: String,
        required: true
    },
    firstStreet:{
        type: String,
        required: true
    },
    city:{
        type: String,
        required: true
    },
    state:{
        type: String,
        required: true
    },
    zipCode:{
        type: Number,

    }
});

var itemSchema = new Schema({
    varient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Varient'
    },
    quantity: {
        type: Number,
        required: true
    },
    cost:{
        type: Number,
        required: true
    }
});


var User = new Schema({
    firstName: {
        type: String
        // required: true
    },
    lastName:{
        type: String
        // required: true
    },
    image:{
        type: String
    },
    addresses: [addressSchema],
    contactNumbers:[
        {
            type: String
        }
    ],
    orders: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order'
        }
    ],
    wishlist: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
        }
    ],
    cart: [itemSchema]
    
}, {
    timestamps: true
});
User.plugin(passportLocalMongoose, { usernameField : 'email' });

module.exports = mongoose.model('User', User);