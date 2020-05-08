const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('./cors');

const Orders = require('../models/varients');
var authenticate = require('../authenticate');


const orderRouter = express.Router();

orderRouter.use(bodyParser.json());

orderRouter.route('/')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, (req,res,next) => {
    Orders.find(req.query)
    .populate('orderItems.varient')
    .then(orders =>{
        res.statusCode =200;
        res.setHeader('Content-Type', 'application/json');
        res.json(orders);
    }, err =>{
        next(err);
    }).catch(err =>{
        next(err);
    }); 

})
.post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Orders.create(req.body).then(order =>{
        console.log('Order created', order);
        res.statusCode =200;
        res.setHeader('Content-Type', 'application/json');
        res.json(order);
    }, err =>{
        next(err);
    }).catch(err =>{
        next(err);
    }); 
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /varients');
})
.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Orders.remove({}).then(response =>{
        res.statusCode =200;
        res.setHeader('Content-Type', 'application/json');
        res.json(response); 
    }, err =>{
        next(err);
    }).catch(err =>{
        next(err);
    });
});

orderRouter.route('/:orderId')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, (req,res,next) => {
    Orders.findById(req.params.orderId)
    .populate('orderItems.varient')
    .then(order =>{
        res.statusCode =200;
        res.setHeader('Content-Type', 'application/json');
        res.json(order);
    }, err =>{
        next(err);
    }).catch(err =>{
        next(err);
    }); 
})

.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('POST operation not supported on /orders/'+ req.params.orderId);
})

.put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Orders.findByIdAndUpdate(req.params.orderId,{
        $set: req.body
    },
    {
        new: true
    }).then(order =>{
        res.statusCode =200;
        res.setHeader('Content-Type', 'application/json');
        res.json(order);
    }, err =>{
        next(err);
    }).catch(err =>{
        next(err);
    }); 
})

.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Orders.findByIdAndRemove(req.params.orderId).then(response =>{
        res.statusCode =200;
        res.setHeader('Content-Type', 'application/json');
        res.json(response); 
    }, err =>{
        next(err);
    }).catch(err =>{
        next(err);
    });
    });

orderRouter.route('/:orderId/orderItems')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, (req,res,next) => {
    Orders.findById(req.params.orderId)
    .populate('orderItems.varient')
    .then((order) => {
        if (order != null) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(order.orderItems);
        }
        else {
            err = new Error('Order ' + req.params.orderId + ' not found');
            err.status = 404;
            return next(err);
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Orders.findById(req.params.orderId)
    .then((order) => {
        if (order != null) {
            // req.body.author = req.user._id;
            order.orderItems.push(req.body);
            order.save()
            .then((order) => {
                Orders.findById(order._id).populate('orderItems.varient').then(order =>{
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(order); 
                })
                               
            }, (err) => next(err));
        }
        else {
            err = new Error('Order ' + req.params.orderId + ' not found');
            err.status = 404;
            return next(err);
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /orders/'
        + req.params.orderId + '/orderItems');
})
.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Orders.findById(req.params.orderId)
    .then((order) => {
        if (order != null) {
            for (var i = (order.orderItems.length -1); i >= 0; i--) {
                order.orderItems.id(order.orderItems[i]._id).remove();
            }
            order.save()
            .then((order) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(order);                
            }, (err) => next(err));
        }
        else {
            err = new Error('Order ' + req.params.orderId + ' not found');
            err.status = 404;
            return next(err);
        }
    }, (err) => next(err))
    .catch((err) => next(err));    
});

orderRouter.route('/:orderId/orderItems/:itemId')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, (req,res,next) => {
    Orders.findById(req.params.orderId)
    .populate('orderItems.varient')
    .then((order) => {
        if (order != null && order.orderItems.id(req.params.itemId) != null) {

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(order.orderItems.id(req.params.itemId));
        }
        else if (order == null) {
            err = new Error('Order' + req.params.orderId + ' not found');
            err.status = 404;
            return next(err);
        }
        else {
            err = new Error('OrderItems ' + req.params.itemId + ' not found');
            err.status = 404;
            return next(err);            
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})
.post(cors.corsWithOptions, (req, res, next) => {
    res.statusCode = 403;
    res.end('POST operation not supported on /orders/'+ req.params.orderId
        + '/orderItems/' + req.params.itemId);
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Orders.findById(req.params.orderId)
    .then((order) => {
        if (order != null && order.orderItems.id(req.params.itemId) != null) {
            // if(req.user._id.equals(dish.comments.id(req.params.commentId).author)){
                if (req.body.quantity) {
                    order.orderItems.id(req.params.itemId).quantity = req.body.quantity;
                }
                if (req.body.cost) {
                    order.orderItems.id(req.params.itemId).cost = req.body.cost;                
                }
                order.save()
                .then((order) => {
                    Orders.findById(order._id).populate('orderItems.varient').then(order =>{
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.json(order);
                    })
                                    
                }, (err) => next(err));
            // }
            // else{
            //     err = new Error('Only author can update a comment');
            //     err.status = 403;
            //     return next(err);
            // }
            
        }
        else if (order == null) {
            err = new Error('Order ' + req.params.orderId + ' not found');
            err.status = 404;
            return next(err);
        }
        else {
            err = new Error('OrderItem ' + req.params.itemId + ' not found');
            err.status = 404;
            return next(err);            
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})
.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Orders.findById(req.params.orderId)
    .populate('orderItems.varient')
    .then((order) => {
        if (order != null && order.orderItems.id(req.params.itemId) != null) {
            // if(req.user._id.equals(category.subCategories.id(req.params.subCategorytId).author)){
                order.orderItems.id(req.params.itemId).remove();
                order.save()
                .then((order) => {
                    Orders.findById(order._id).then(order =>{
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.json(order);
                    })
                                    
                }, (err) => next(err));
            // }
            // else{
            //     err = new Error('Only author can update a comment');
            //     err.status = 403;
            //     return next(err);
            // }
            
        }
        else if (order == null) {
            err = new Error('Order ' + req.params.orderId + ' not found');
            err.status = 404;
            return next(err);
        }
        else {
            err = new Error('OrderItem ' + req.params.itemId + ' not found');
            err.status = 404;
            return next(err);            
        }
    }, (err) => next(err))
    .catch((err) => next(err));
});


module.exports = orderRouter;