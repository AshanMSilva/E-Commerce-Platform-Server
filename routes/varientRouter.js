const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('./cors');

const Varients = require('../models/varients');
var authenticate = require('../authenticate');


const varientRouter = express.Router();

varientRouter.use(bodyParser.json());

varientRouter.route('/')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, (req,res,next) => {
    Varients.find(req.query)
    .then(varients =>{
        res.statusCode =200;
        res.setHeader('Content-Type', 'application/json');
        res.json(varients);
    }, err =>{
        next(err);
    }).catch(err =>{
        next(err);
    }); 

})
.post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Varients.create(req.body).then(varient =>{
        console.log('Varient created', varient);
        res.statusCode =200;
        res.setHeader('Content-Type', 'application/json');
        res.json(varient);
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
    Varients.remove({}).then(response =>{
        res.statusCode =200;
        res.setHeader('Content-Type', 'application/json');
        res.json(response); 
    }, err =>{
        next(err);
    }).catch(err =>{
        next(err);
    });
});

varientRouter.route('/:varientId')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, (req,res,next) => {
    Varients.findById(req.params.varientId)
    .then(varient =>{
        res.statusCode =200;
        res.setHeader('Content-Type', 'application/json');
        res.json(varient);
    }, err =>{
        next(err);
    }).catch(err =>{
        next(err);
    }); 
})

.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('POST operation not supported on /varients/'+ req.params.varientId);
})

.put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Varients.findByIdAndUpdate(req.params.varientId,{
        $set: req.body
    },
    {
        new: true
    }).then(varient =>{
        res.statusCode =200;
        res.setHeader('Content-Type', 'application/json');
        res.json(varient);
    }, err =>{
        next(err);
    }).catch(err =>{
        next(err);
    }); 
})

.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Varients.findByIdAndRemove(req.params.varientId).then(response =>{
        res.statusCode =200;
        res.setHeader('Content-Type', 'application/json');
        res.json(response); 
    }, err =>{
        next(err);
    }).catch(err =>{
        next(err);
    });
    });

varientRouter.route('/:varientId/attributes')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, (req,res,next) => {
    Varients.findById(req.params.varientId)
    .then((varient) => {
        if (varient != null) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(varient.attributes);
        }
        else {
            err = new Error('Varient ' + req.params.varientId + ' not found');
            err.status = 404;
            return next(err);
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Varients.findById(req.params.varientId)
    .then((varient) => {
        if (varient != null) {
            // req.body.author = req.user._id;
            varient.attributes.push(req.body);
            varient.save()
            .then((varient) => {
                Varients.findById(varient._id).then(varient =>{
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(varient); 
                })
                               
            }, (err) => next(err));
        }
        else {
            err = new Error('Varient ' + req.params.varientId + ' not found');
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
    Varients.findById(req.params.varientId)
    .then((varient) => {
        if (varient != null) {
            for (var i = (varient.attributes.length -1); i >= 0; i--) {
                varient.attributes.id(varient.attributes[i]._id).remove();
            }
            varient.save()
            .then((varient) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(varient);                
            }, (err) => next(err));
        }
        else {
            err = new Error('Varient ' + req.params.varientId + ' not found');
            err.status = 404;
            return next(err);
        }
    }, (err) => next(err))
    .catch((err) => next(err));    
});

varientRouter.route('/:varientId/attributes/:attributeId')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, (req,res,next) => {
    Varients.findById(req.params.varientId)
    .then((varient) => {
        if (varient != null && varient.attributes.id(req.params.attributeId) != null) {

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(varient.attributes.id(req.params.attributeId));
        }
        else if (varient == null) {
            err = new Error('Varient' + req.params.varientId + ' not found');
            err.status = 404;
            return next(err);
        }
        else {
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
    Varients.findById(req.params.varientId)
    .then((varient) => {
        if (varient != null && varient.attributes.id(req.params.attributeId) != null) {
            // if(req.user._id.equals(dish.comments.id(req.params.commentId).author)){
                if (req.body.name) {
                    varient.attributes.id(req.params.attributeId).name = req.body.name;
                }
                if (req.body.value) {
                    varient.attributes.id(req.params.attributeId).value = req.body.value;                
                }
                varient.save()
                .then((varient) => {
                    Varients.findById(varient._id).then(varient =>{
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.json(varient);
                    })
                                    
                }, (err) => next(err));
            
        }
        else if (varient == null) {
            err = new Error('Varient ' + req.params.varientId + ' not found');
            err.status = 404;
            return next(err);
        }
        else {
            err = new Error('Attributes ' + req.params.attributeId + ' not found');
            err.status = 404;
            return next(err);            
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})
.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Varients.findById(req.params.varientId)
    .then((varient) => {
        if (varient != null && varient.attributes.id(req.params.attributeId) != null) {
            // if(req.user._id.equals(category.subCategories.id(req.params.subCategorytId).author)){
                varient.attributes.id(req.params.attributeId).remove();
                varient.save()
                .then((varient) => {
                    Varients.findById(varient._id).then(varient =>{
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.json(varient);
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
            err = new Error('Varient ' + req.params.varientId + ' not found');
            err.status = 404;
            return next(err);
        }
        else {
            err = new Error('Attributes ' + req.params.attributeId + ' not found');
            err.status = 404;
            return next(err);            
        }
    }, (err) => next(err))
    .catch((err) => next(err));
});


module.exports = varientRouter;