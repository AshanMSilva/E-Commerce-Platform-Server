const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('./cors');

const Categories = require('../models/categories');
var authenticate = require('../authenticate');


const categoryRouter = express.Router();

categoryRouter.use(bodyParser.json());

categoryRouter.route('/')
// .all((req,res,next) => {
//     res.statusCode = 200;
//     res.setHeader('Content-Type', 'text/plain');
//     next();
// })
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, (req,res,next) => {
    Categories.find(req.query)
    .populate('subCategories')
    .populate('products')
    .then(categories =>{
        res.statusCode =200;
        res.setHeader('Content-Type', 'application/json');
        res.json(categories);
    }, err =>{
        next(err);
    }).catch(err =>{
        next(err);
    }); 

})
.post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Categories.create(req.body).then(category =>{
        console.log('Ctegory created', category);
        res.statusCode =200;
        res.setHeader('Content-Type', 'application/json');
        res.json(category);
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
    Categories.remove({}).then(response =>{
        res.statusCode =200;
        res.setHeader('Content-Type', 'application/json');
        res.json(response); 
    }, err =>{
        next(err);
    }).catch(err =>{
        next(err);
    });
});

categoryRouter.route('/:categoryId')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, (req,res,next) => {
    Categories.findById(req.params.categoryId)
    .populate('subCategories')
    .populate('products')
    .then(category =>{
        res.statusCode =200;
        res.setHeader('Content-Type', 'application/json');
        res.json(category);
    }, err =>{
        next(err);
    }).catch(err =>{
        next(err);
    }); 
})

.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('POST operation not supported on /categories/'+ req.params.categoryId);
})

.put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Categories.findByIdAndUpdate(req.params.categoryId,{
        $set: req.body
    },
    {
        new: true
    }).then(category =>{
        res.statusCode =200;
        res.setHeader('Content-Type', 'application/json');
        res.json(category);
    }, err =>{
        next(err);
    }).catch(err =>{
        next(err);
    }); 
})

.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Categories.findByIdAndRemove(req.params.categoryId).then(response =>{
        res.statusCode =200;
        res.setHeader('Content-Type', 'application/json');
        res.json(response); 
    }, err =>{
        next(err);
    }).catch(err =>{
        next(err);
    });
    });

categoryRouter.route('/:categoryId/subCategories')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, (req,res,next) => {
    Categories.findById(req.params.categoryId)
    .populate('subCategories')
    .populate('products')
    .then((category) => {
        if (category != null) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(category.subCategories);
        }
        else {
            err = new Error('Category ' + req.params.categoryId + ' not found');
            err.status = 404;
            return next(err);
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Categories.findById(req.params.categoryId)
    .then((category) => {
        if (category != null) {
            // req.body.author = req.user._id;
            category.subCategories.push(req.body);
            category.save()
            .then((category) => {
                Categories.findById(category._id).populate('subCategories').populate('products').then(category =>{
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(category); 
                })
                               
            }, (err) => next(err));
        }
        else {
            err = new Error('Category ' + req.params.categoryId + ' not found');
            err.status = 404;
            return next(err);
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /categories/'
        + req.params.categoryId + '/subCategories');
})
.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Categories.findById(req.params.categoryId)
    .then((category) => {
        if (category != null) {
            for (var i = (category.subCategories.length -1); i >= 0; i--) {
                category.subCategories.id(category.subCategories[i]._id).remove();
            }
            category.save()
            .then((category) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(category);                
            }, (err) => next(err));
        }
        else {
            err = new Error('Category ' + req.params.categoryId + ' not found');
            err.status = 404;
            return next(err);
        }
    }, (err) => next(err))
    .catch((err) => next(err));    
});

categoryRouter.route('/:categoryId/subCategories/:subCategoryId')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, (req,res,next) => {
    Categories.findById(req.params.categoryId)
    .populate('subcategories')
    .then((category) => {
        if (category != null && category.subCategories.id(req.params.subCategoryId) != null) {

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(category.subCategories.id(req.params.subCategoryId));
        }
        else if (category == null) {
            err = new Error('Category' + req.params.categoryId + ' not found');
            err.status = 404;
            return next(err);
        }
        else {
            err = new Error('SubCategories ' + req.params.subCategoryId + ' not found');
            err.status = 404;
            return next(err);            
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})
.post(cors.corsWithOptions, (req, res, next) => {
    res.statusCode = 403;
    res.end('POST operation not supported on /categories/'+ req.params.categoryId
        + '/subCategories/' + req.params.subCategoryId);
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /categories/'+ req.params.categoryId
        + '/subCategories/' + req.params.subCategoryId);
})
.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Categories.findById(req.params.categoryId)
    .populate('subCategories')
    .then((category) => {
        if (categry != null && category.subCategories.id(req.params.subCategoryId) != null) {
            // if(req.user._id.equals(category.subCategories.id(req.params.subCategorytId).author)){
                category.subCategories.id(req.params.subCategoryId).remove();
                category.save()
                .then((category) => {
                    Categories.findById(category._id).populate('subCategories').populate('products').then(category =>{
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.json(category);
                    })
                                    
                }, (err) => next(err));
            // }
            // else{
            //     err = new Error('Only author can update a comment');
            //     err.status = 403;
            //     return next(err);
            // }
            
        }
        else if (category == null) {
            err = new Error('Category ' + req.params.categoryId + ' not found');
            err.status = 404;
            return next(err);
        }
        else {
            err = new Error('Sub Category ' + req.params.subCategoryId + ' not found');
            err.status = 404;
            return next(err);            
        }
    }, (err) => next(err))
    .catch((err) => next(err));
});


categoryRouter.route('/:categoryId/products')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, (req,res,next) => {
    Categories.findById(req.params.categoryId)
    .populate('subCategories')
    .populate('products')
    .then((category) => {
        if (category != null) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(category.products);
        }
        else {
            err = new Error('Category ' + req.params.categoryId + ' not found');
            err.status = 404;
            return next(err);
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Categories.findById(req.params.categoryId)
    .then((category) => {
        if (category != null) {
            // req.body.author = req.user._id;
            category.products.push(req.body);
            category.save()
            .then((category) => {
                Categories.findById(category._id).populate('subCategories').populate('products').then(category =>{
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(category); 
                })
                               
            }, (err) => next(err));
        }
        else {
            err = new Error('Category ' + req.params.categoryId + ' not found');
            err.status = 404;
            return next(err);
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /categories/'
        + req.params.categoryId + '/products');
})
.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Categories.findById(req.params.categoryId)
    .then((category) => {
        if (category != null) {
            for (var i = (category.products.length -1); i >= 0; i--) {
                category.products.id(category.products[i]._id).remove();
            }
            category.save()
            .then((category) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(category);                
            }, (err) => next(err));
        }
        else {
            err = new Error('Category ' + req.params.categoryId + ' not found');
            err.status = 404;
            return next(err);
        }
    }, (err) => next(err))
    .catch((err) => next(err));    
});





categoryRouter.route('/:categoryId/products/:productId')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, (req,res,next) => {
    Categories.findById(req.params.categoryId)
    .populate('products')
    .then((category) => {
        if (category != null && category.products.id(req.params.productId) != null) {

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(category.subCategories.id(req.params.productId));
        }
        else if (category == null) {
            err = new Error('Category' + req.params.categoryId + ' not found');
            err.status = 404;
            return next(err);
        }
        else {
            err = new Error('Products ' + req.params.productId + ' not found');
            err.status = 404;
            return next(err);            
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})
.post(cors.corsWithOptions, (req, res, next) => {
    res.statusCode = 403;
    res.end('POST operation not supported on /categories/'+ req.params.categoryId
        + '/products/' + req.params.productId);
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /categories/'+ req.params.categoryId
        + '/products/' + req.params.productId);
})
.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Categories.findById(req.params.categoryId)
    .populate('products')
    .then((category) => {
        if (categry != null && category.products.id(req.params.productId) != null) {
            // if(req.user._id.equals(category.subCategories.id(req.params.subCategorytId).author)){
                category.products.id(req.params.productId).remove();
                category.save()
                .then((category) => {
                    Categories.findById(category._id).populate('subCategories').populate('products').then(category =>{
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.json(category);
                    })
                                    
                }, (err) => next(err));
            // }
            // else{
            //     err = new Error('Only author can update a comment');
            //     err.status = 403;
            //     return next(err);
            // }
            
        }
        else if (category == null) {
            err = new Error('Category ' + req.params.categoryId + ' not found');
            err.status = 404;
            return next(err);
        }
        else {
            err = new Error('Products ' + req.params.productId + ' not found');
            err.status = 404;
            return next(err);            
        }
    }, (err) => next(err))
    .catch((err) => next(err));
});

module.exports = categoryRouter;