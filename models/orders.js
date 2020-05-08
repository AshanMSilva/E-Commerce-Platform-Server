const mongoose = require('mongoose');
const Schema = mongoose.Schema;

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

var paymentDetailsSchema = new Schema({
    cardNumber:{
        type: String,
        required: true
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

var orderSchema = new Schema({
    orderItems:[itemSchema],
    cost:{
        type: Number,
        required:true
    },
    status: {
        type: String,
        default: 'Proccessing'
    },
    orderedDate: {
        type: Date, 
        default: Date.now()
    },
    expiredDate:{
        type: Date,
        default: +new Date() + 60*24*60*60*1000
    },
    deliveryAddress: addressSchema,
    paymentDetails: paymentDetailsSchema
}, {
    timestamps: true
});


var Orders = mongoose.model('Order', orderSchema);

module.exports = Orders;