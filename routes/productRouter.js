const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('./cors');

const Products = require('../models/products');
var authenticate = require('../authenticate');


const productRouter = express.Router();

productRouter.use(bodyParser.json());

productRouter.route('/')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, (req,res,next) => {
    Products.find(req.query)
    .populate('varients')
    .then(products =>{
        res.statusCode =200;
        res.setHeader('Content-Type', 'application/json');
        res.json(products);
    }, err =>{
        next(err);
    }).catch(err =>{
        next(err);
    }); 

})
.post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Products.create(req.body).then(product =>{
        console.log('Product created', product);
        res.statusCode =200;
        res.setHeader('Content-Type', 'application/json');
        res.json(product);
    }, err =>{
        next(err);
    }).catch(err =>{
        next(err);
    }); 
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /categories');
})
.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Products.remove({}).then(response =>{
        res.statusCode =200;
        res.setHeader('Content-Type', 'application/json');
        res.json(response); 
    }, err =>{
        next(err);
    }).catch(err =>{
        next(err);
    });
});

productRouter.route('/:productId')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, (req,res,next) => {
    Products.findById(req.params.productId)
    .then(product =>{
        res.statusCode =200;
        res.setHeader('Content-Type', 'application/json');
        res.json(product);
    }, err =>{
        next(err);
    }).catch(err =>{
        next(err);
    }); 
})

.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('POST operation not supported on /products/'+ req.params.productId);
})

.put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Products.findByIdAndUpdate(req.params.productId,{
        $set: req.body
    },
    {
        new: true
    }).then(product =>{
        res.statusCode =200;
        res.setHeader('Content-Type', 'application/json');
        res.json(product);
    }, err =>{
        next(err);
    }).catch(err =>{
        next(err);
    }); 
})

.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Products.findByIdAndRemove(req.params.productId).then(response =>{
        res.statusCode =200;
        res.setHeader('Content-Type', 'application/json');
        res.json(response); 
    }, err =>{
        next(err);
    }).catch(err =>{
        next(err);
    });
    });

productRouter.route('/:productId/varients')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, (req,res,next) => {
    Products.findById(req.params.productId)
    .then((product) => {
        if (product != null) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(product.varients);
        }
        else {
            err = new Error('Product ' + req.params.productId + ' not found');
            err.status = 404;
            return next(err);
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Products.findById(req.params.productId)
    .then((product) => {
        if (product != null) {
            // req.body.author = req.user._id;
            product.varients.push(req.body);
            product.save()
            .then((product) => {
                Products.findById(product._id).then(product =>{
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(product); 
                })
                               
            }, (err) => next(err));
        }
        else {
            err = new Error('Product ' + req.params.productId + ' not found');
            err.status = 404;
            return next(err);
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /products/'
        + req.params.productId + '/varients');
})
.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Products.findById(req.params.productId)
    .then((product) => {
        if (product != null) {
            for (var i = (product.varients.length -1); i >= 0; i--) {
                product.varients.id(product.varients[i]._id).remove();
            }
            product.save()
            .then((product) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(product);                
            }, (err) => next(err));
        }
        else {
            err = new Error('Product ' + req.params.productId + ' not found');
            err.status = 404;
            return next(err);
        }
    }, (err) => next(err))
    .catch((err) => next(err));    
});

productRouter.route('/:productId/varients/:varientId')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, (req,res,next) => {
    Products.findById(req.params.productId)
    .then((product) => {
        if (product != null && product.varients.id(req.params.varientId) != null) {

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(product.varients.id(req.params.varientId));
        }
        else if (product == null) {
            err = new Error('Product' + req.params.productId + ' not found');
            err.status = 404;
            return next(err);
        }
        else {
            err = new Error('Varients ' + req.params.varientId + ' not found');
            err.status = 404;
            return next(err);            
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})
.post(cors.corsWithOptions, (req, res, next) => {
    res.statusCode = 403;
    res.end('POST operation not supported on /products/'+ req.params.productId
        + '/varients/' + req.params.varientId);
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Products.findById(req.params.productId)
    .then((product) => {
        if (product != null && product.varients.id(req.params.varientId) != null) {
            if(req.body.name){
                product.varients.id(req.params.varientId).name = req.body.name;
            }
            if(req.body.price){
                product.varients.id(req.params.varientId).price = req.body.price;
            }
            if(req.body.availability){
                product.varients.id(req.params.varientId).availability = req.body.availability;
            }
            if(req.body.sales){
                product.varients.id(req.params.varientId).sales = req.body.sales;
            }
            product.save();
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(product.varients.id(req.params.varientId));
        }
        else if (product == null) {
            err = new Error('Product' + req.params.productId + ' not found');
            err.status = 404;
            return next(err);
        }
        else {
            err = new Error('Varients ' + req.params.varientId + ' not found');
            err.status = 404;
            return next(err);            
        }
    }, (err) => next(err))
    .catch((err) => next(err));
    
})
.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Products.findById(req.params.productId)
    .then((product) => {
        if (product != null && product.varients.id(req.params.varientId) != null) {
            // if(req.user._id.equals(category.subCategories.id(req.params.subCategorytId).author)){
                product.varients.id(req.params.varientId).remove();
                product.save()
                .then((product) => {
                    Products.findById(product._id).then(product =>{
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.json(product);
                    })
                                    
                }, (err) => next(err));
            // }
            // else{
            //     err = new Error('Only author can update a comment');
            //     err.status = 403;
            //     return next(err);
            // }
            
        }
        else if (product == null) {
            err = new Error('Product ' + req.params.productId + ' not found');
            err.status = 404;
            return next(err);
        }
        else {
            err = new Error('Varients ' + req.params.varientId + ' not found');
            err.status = 404;
            return next(err);            
        }
    }, (err) => next(err))
    .catch((err) => next(err));
});

productRouter.route('/:productId/varients/:varientId/attributes')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, (req,res,next) => {
    Products.findById(req.params.productId)
    .then((product) => {
        if (product != null && product.varients.id(req.params.varientId) != null) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(product.varients.id(req.params.varientId).attributes);
        }
        else if (product == null) {
            err = new Error('Product' + req.params.productId + ' not found');
            err.status = 404;
            return next(err);
        }
        else {
            err = new Error('Varients ' + req.params.varientId + ' not found');
            err.status = 404;
            return next(err);            
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Products.findById(req.params.productId)
    .then((product) => {
        if (product != null && product.varients.id(req.params.varientId) != null) {
            product.varients.id(req.params.varientId).attributes.push(req.body);
            product.save().then(
                product =>{
                    Products.findById(product._id).then(
                        product =>{
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.json(product.varients.id(req.params.varientId)); 
                        }
                    )
                },(err) => next(err)
            )
        }
        else if (product == null) {
            err = new Error('Product' + req.params.productId + ' not found');
            err.status = 404;
            return next(err);
        }
        else {
            err = new Error('Varients ' + req.params.varientId + ' not found');
            err.status = 404;
            return next(err);            
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /varients/'
        + req.params.varientId + '/attributes');
})
.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Products.findById(req.params.productId)
    .then((product) => {
        if (product != null && product.varients.id(req.params.varientId) != null) {
            for (var i = (product.varients.id(req.params.varientId).attributes.length -1); i >= 0; i--) {
                product.varients.id(req.params.varientId).attributes.id(product.varients.id(req.params.varientId).attributes[i]._id).remove();
            }
            product.save()
            .then((product) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(product.varients.id(req.params.varientId));                
            }, (err) => next(err));
        }
        else if (product == null) {
            err = new Error('Product' + req.params.productId + ' not found');
            err.status = 404;
            return next(err);
        }
        else {
            err = new Error('Varients ' + req.params.varientId + ' not found');
            err.status = 404;
            return next(err);            
        }
    }, (err) => next(err))
    .catch((err) => next(err));
});

productRouter.route('/:productId/varients/:varientId/attributes/:attributeId')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, (req,res,next) => {
    Products.findById(req.params.productId)
    .then((product) => {
        if (product != null && product.varients.id(req.params.varientId) != null && product.varients.id(req.params.varientId).attributes.id(req.params.attributeId) != null) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(product.varients.id(req.params.varientId).attributes.id(req.params.attributeId));
        }
        else if (product == null) {
            err = new Error('Product' + req.params.productId + ' not found');
            err.status = 404;
            return next(err);
        }
        else if(product.varients.id(req.params.varientId) == null){
            err = new Error('Varients ' + req.params.varientId + ' not found');
            err.status = 404;
            return next(err);            
        }
        else{
            err = new Error('Attributes ' + req.params.attributeId + ' not found');
            err.status = 404;
            return next(err); 
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})
.post(cors.corsWithOptions, (req, res, next) => {
    res.statusCode = 403;
    res.end('POST operation not supported on /varients/'+ req.params.varientId
        + '/attributes/' + req.params.attributeId);
})
.put(cors.corsWithOptions, authenticate.verifyUser,authenticate.verifyAdmin, (req, res, next) => {
    Products.findById(req.params.productId)
    .then((product) => {
        if (product != null && product.varients.id(req.params.varientId) != null && product.varients.id(req.params.varientId).attributes.id(req.params.attributeId) != null) {
            if (req.body.name) {
                product.varients.id(req.params.varientId).attributes.id(req.params.attributeId).name = req.body.name;
            }
            if (req.body.value) {
                product.varients.id(req.params.varientId).attributes.id(req.params.attributeId).value = req.body.value;                
            }
            product.save()
            .then((product) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(product.varients.id(req.params.varientId));                
            }, (err) => next(err));
        }
        else if (product == null) {
            err = new Error('Product' + req.params.productId + ' not found');
            err.status = 404;
            return next(err);
        }
        else if(product.varients.id(req.params.varientId) == null){
            err = new Error('Varients ' + req.params.varientId + ' not found');
            err.status = 404;
            return next(err);            
        }
        else{
            err = new Error('Attributes ' + req.params.attributeId + ' not found');
            err.status = 404;
            return next(err); 
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})
.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Products.findById(req.params.productId)
    .then((product) => {
        if (product != null && product.varients.id(req.params.varientId) != null && product.varients.id(req.params.varientId).attributes.id(req.params.attributeId) != null) {
            product.varients.id(req.params.varientId).attributes.id(req.params.attributeId).remove();
            product.save()
            .then((product) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(product.varients.id(req.params.varientId));                
            }, (err) => next(err));
        }
        else if (product == null) {
            err = new Error('Product' + req.params.productId + ' not found');
            err.status = 404;
            return next(err);
        }
        else if(product.varients.id(req.params.varientId) == null){
            err = new Error('Varients ' + req.params.varientId + ' not found');
            err.status = 404;
            return next(err);            
        }
        else{
            err = new Error('Attributes ' + req.params.attributeId + ' not found');
            err.status = 404;
            return next(err); 
        }
    }, (err) => next(err))
    .catch((err) => next(err));
});



module.exports = productRouter;