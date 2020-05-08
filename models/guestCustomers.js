var mongoose = require('mongoose');
var Schema = mongoose.Schema;

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

var guestCustomerSchema = new Scehema({
    firstName:{
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    cart: [itemSchema]
},
{
    timestamps: true
});

var GuestCustomers = mongoose.model('GuestCustomer', guestCustomerSchema);

module.exports = GuestCustomers;