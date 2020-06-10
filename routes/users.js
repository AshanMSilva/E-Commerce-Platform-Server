var express = require('express');
const bodyParser = require('body-parser');
var User = require('../models/user');
var passport = require('passport');
const cors = require('./cors');

var authenticate = require('../authenticate');

var router = express.Router();
router.use(bodyParser.json());


/* GET users listing. */
router.options('/', cors.corsWithOptions, (req, res) => { res.sendStatus(200); });
router.get('/', cors.cors, function(req, res, next) {
  User.find(req.query)
    .then(users =>{
        res.statusCode =200;
        res.setHeader('Content-Type', 'application/json');
        res.json(users);
    }, err =>{
        next(err);
    }).catch(err =>{
        next(err);
    }); 
});

router.post('/signup', cors.corsWithOptions, (req, res, next) => {
  User.register(new User({email: req.body.email}), 
    req.body.password, (err, user) => {
    if(err) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.json({err: err});
    }
    else {
      if(req.body.firstName){
        user.firstName = req.body.firstName;
      }
      if(req.body.lastName){
        user.lastName = req.body.lastName;
      }
      user.addresses= req.body.addresses;
      user.contactNumbers = req.body.contactNumbers;
      user.save((err,user)=>{
        if(err){
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.json({err: err});
          return;
        }
        passport.authenticate('local')(req, res, () => {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.json({success: true, status: 'Registration Successful!'});
        });
      });
      
    }
  });
});


router.post('/login', cors.corsWithOptions, (req, res, next) => {

  passport.authenticate('local', (err, user, info) => {
    if (err)
      return next(err);

    if (!user) {
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json');
      res.json({success: false, status: 'Login Unsuccessful!', err: info});
    }
    req.logIn(user, (err) => {
      if (err) {
        res.statusCode = 401;
        res.setHeader('Content-Type', 'application/json');
        res.json({success: false, status: 'Login Unsuccessful!', err: 'Could not log in user!'});          
      }

      var token = authenticate.getToken({_id: req.user._id});
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.json({success: true, status: 'Login Successful!', token: token});
    }); 
  }) (req, res, next);
});

router.get('/checkJWTtoken', cors.corsWithOptions, (req, res) => {
  passport.authenticate('jwt', {session: false}, (err, user, info) => {
    if (err)
      return next(err);
    
    if (!user) {
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json');
      return res.json({status: 'JWT invalid!', success: false, err: info});
    }
    else {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.json({status: 'JWT valid!', success: true, user: user});

    }
  }) (req, res);
});

router.get('/logout', cors.cors, (req, res) => {
  if (req.session) {
    console.log(req.session);
    req.session.destroy();
    res.clearCookie('session-id');
    res.json('Successfully logout')
  }
  else {
    var err = new Error('You are not logged in!');
    err.status = 403;
    // next(err);
    res.json(err.message);
  }
});


router.route('/:userId')
.options(cors.corsWithOptions,authenticate.verifyUser, authenticate.verifyAdmin, (req, res) => { res.sendStatus(200); })
.get(cors.cors, (req,res,next) => {
    User.findById(req.params.userId)
    .populate('wishlist')
    .populate('orders')
    .populate('cart.varient')
    .then(user =>{
        res.statusCode =200;
        res.setHeader('Content-Type', 'application/json');
        res.json(user);
    }, err =>{
        next(err);
    }).catch(err =>{
        next(err);
    }); 
})

.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('POST operation not supported on /users/'+ req.params.userId);
})

.put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    User.findByIdAndUpdate(req.params.userId,{
        $set: req.body
    },
    {
        new: true
    }).then(user =>{
        res.statusCode =200;
        res.setHeader('Content-Type', 'application/json');
        res.json(user);
    }, err =>{
        next(err);
    }).catch(err =>{
        next(err);
    }); 
})

.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    User.findByIdAndRemove(req.params.userId).then(response =>{
        res.statusCode =200;
        res.setHeader('Content-Type', 'application/json');
        res.json(response); 
    }, err =>{
        next(err);
    }).catch(err =>{
        next(err);
    });
    });

router.route('/:userId/orders')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, (req,res,next) => {
    User.findById(req.params.userId)
    .populate('wishlist')
    .populate('orders')
    .populate('cart.varient')
    .then((user) => {
        if (user != null) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(user.orders);
        }
        else {
            err = new Error('User ' + req.params.userId + ' not found');
            err.status = 404;
            return next(err);
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    User.findById(req.params.userId)
    .then((user) => {
        if (user != null) {
            // req.body.author = req.user._id;
            user.orders.push(req.body.id);
            user.save()
            .then((user) => {
                User.findById(user._id).populate('wishlist').populate('orders').populate('cart.varient').then(user =>{
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(user); 
                })
                               
            }, (err) => next(err));
        }
        else {
            err = new Error('User ' + req.params.userId + ' not found');
            err.status = 404;
            return next(err);
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /users/'
        + req.params.userId + '/orders');
})
.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    User.findById(req.params.userId)
    .populate('orders')
    .then((user) => {
        if (user != null) {
            for (var i = (user.orders.length -1); i >= 0; i--) {
                user.orders.id(user.orders[i]._id).remove();
            }
            user.save()
            .then((user) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(user);                
            }, (err) => next(err));
        }
        else {
            err = new Error('User ' + req.params.userId + ' not found');
            err.status = 404;
            return next(err);
        }
    }, (err) => next(err))
    .catch((err) => next(err));    
});

router.route('/:userId/orders/:orderId')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, (req,res,next) => {
    User.findById(req.params.userId)
    .populate('orders')
    .then((user) => {
        if (user != null && user.orders.id(req.params.orderId) != null) {

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(user.orders.id(req.params.orderId));
        }
        else if (user == null) {
            err = new Error('User' + req.params.userId + ' not found');
            err.status = 404;
            return next(err);
        }
        else {
            err = new Error('Order ' + req.params.orderId + ' not found');
            err.status = 404;
            return next(err);            
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})
.post(cors.corsWithOptions, (req, res, next) => {
    res.statusCode = 403;
    res.end('POST operation not supported on /users/'+ req.params.userId
        + '/orders/' + req.params.orderId);
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /users/'+ req.params.userId
        + '/orders/' + req.params.orderId);
})
.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    User.findById(req.params.userId)
    .populate('orders')
    .then((user) => {
        if (user != null && user.orders.id(req.params.orderId) != null) {
            // if(req.user._id.equals(category.subCategories.id(req.params.subCategorytId).author)){
                user.orders.id(req.params.orderId).remove();
                user.save()
                .then((user) => {
                    user.findById(user._id).populate('orders').populate('wishlist').populate('cart.varient').then(user =>{
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.json(user);
                    })
                                    
                }, (err) => next(err));
            // }
            // else{
            //     err = new Error('Only author can update a comment');
            //     err.status = 403;
            //     return next(err);
            // }
            
        }
        else if (user == null) {
            err = new Error('User ' + req.params.userId + ' not found');
            err.status = 404;
            return next(err);
        }
        else {
            err = new Error('Orders ' + req.params.orderId + ' not found');
            err.status = 404;
            return next(err);            
        }
    }, (err) => next(err))
    .catch((err) => next(err));
});

router.route('/:userId/addresses')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, (req,res,next) => {
    User.findById(req.params.userId)
    .populate('wishlist')
    .populate('orders')
    .populate('cart.varient')
    .then((user) => {
        if (user != null) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(user.addresses);
        }
        else {
            err = new Error('User ' + req.params.userId + ' not found');
            err.status = 404;
            return next(err);
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    User.findById(req.params.userId)
    .then((user) => {
        if (user != null) {
            // req.body.author = req.user._id;
            user.addresses.push(req.body);
            user.save()
            .then((user) => {
                User.findById(user._id).populate('wishlist').populate('orders').populate('cart.varient').then(user =>{
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(user); 
                })
                               
            }, (err) => next(err));
        }
        else {
            err = new Error('User ' + req.params.userId + ' not found');
            err.status = 404;
            return next(err);
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /users/'
        + req.params.userId + '/addresses');
})
.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    User.findById(req.params.userId)
    .then((user) => {
        if (user != null) {
            for (var i = (user.addresses.length -1); i >= 0; i--) {
                user.addresses.id(user.addresses[i]._id).remove();
            }
            user.save()
            .then((user) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(user);                
            }, (err) => next(err));
        }
        else {
            err = new Error('User ' + req.params.userId + ' not found');
            err.status = 404;
            return next(err);
        }
    }, (err) => next(err))
    .catch((err) => next(err));    
});

router.route('/:userId/addresses/:addressId')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, (req,res,next) => {
    User.findById(req.params.userId)
    .then((user) => {
        if (user != null && user.addresses.id(req.params.addressId) != null) {

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(user.addresses.id(req.params.addressId));
        }
        else if (user == null) {
            err = new Error('User' + req.params.userId + ' not found');
            err.status = 404;
            return next(err);
        }
        else {
            err = new Error('Address ' + req.params.addressId + ' not found');
            err.status = 404;
            return next(err);            
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})
.post(cors.corsWithOptions, (req, res, next) => {
    res.statusCode = 403;
    res.end('POST operation not supported on /users/'+ req.params.userId
        + '/addresses/' + req.params.addressId);
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
  User.findById(req.params.userId)
  .then((user) => {
      if (user != null && user.addresses.id(req.params.addressId) != null) {
          // if(req.user._id.equals(dish.comments.id(req.params.commentId).author)){
              if (req.body.houseNumber) {
                  user.addresses.id(req.params.addressId).houseNumber = req.body.houseNumber;
              }
              if (req.body.firstStreet) {
                  user.addresses.id(req.params.addressId).firstStreet = req.body.firstStreet;
              }
              if (req.body.city) {
                  user.addresses.id(req.params.addressId).city = req.body.city;
              }
              if (req.body.state) {
                  user.addresses.id(req.params.addressId).state = req.body.state;
              }
              if (req.body.zipCode) {
                  user.addresses.id(req.params.addressId).zipCode = req.body.zipCode;
              }
              user.save()
              .then((user) => {
                  User.findById(user._id).then(user =>{
                      res.statusCode = 200;
                      res.setHeader('Content-Type', 'application/json');
                      res.json(user);
                  })
                                  
              }, (err) => next(err));
          
      }
      else if (user == null) {
          err = new Error('User ' + req.params.userId + ' not found');
          err.status = 404;
          return next(err);
      }
      else {
          err = new Error('Address ' + req.params.addressId + ' not found');
          err.status = 404;
          return next(err);            
      }
  }, (err) => next(err))
  .catch((err) => next(err));
})
.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    User.findById(req.params.userId)
    .then((user) => {
        if (user != null && user.addresses.id(req.params.addressId) != null) {
            // if(req.user._id.equals(category.subCategories.id(req.params.subCategorytId).author)){
                user.addresses.id(req.params.addressId).remove();
                user.save()
                .then((user) => {
                    user.findById(user._id).populate('orders').populate('wishlist').populate('cart.varient').then(user =>{
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.json(user);
                    })
                                    
                }, (err) => next(err));
            // }
            // else{
            //     err = new Error('Only author can update a comment');
            //     err.status = 403;
            //     return next(err);
            // }
            
        }
        else if (user == null) {
            err = new Error('User ' + req.params.userId + ' not found');
            err.status = 404;
            return next(err);
        }
        else {
            err = new Error('Address ' + req.params.addressId + ' not found');
            err.status = 404;
            return next(err);            
        }
    }, (err) => next(err))
    .catch((err) => next(err));
});

router.route('/:userId/wishlist')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, (req,res,next) => {
    User.findById(req.params.userId)
    .populate('wishlist')
    .populate('orders')
    .populate('cart.varient')
    .then((user) => {
        if (user != null) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(user.wishlist);
        }
        else {
            err = new Error('User ' + req.params.userId + ' not found');
            err.status = 404;
            return next(err);
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
  User.findById(req.params.userId)
    .then((user) => {
        if (user != null) {
            // req.body.author = req.user._id;
            user.wishlist.push(req.body.id);
            user.save()
            .then((user) => {
                User.findById(user._id).populate('wishlist').populate('orders').populate('cart.varient').then(user =>{
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(user); 
                })
                               
            }, (err) => next(err));
        }
        else {
            err = new Error('User ' + req.params.userId + ' not found');
            err.status = 404;
            return next(err);
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /users/'
        + req.params.userId + '/wishlist');
})
.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
  User.findById(req.params.userId)
    .populate('wishlist')
    .then((user) => {
        if (user != null) {
            for (var i = (user.wishlist.length -1); i >= 0; i--) {
                user.wishlist.id(user.wishlist[i]._id).remove();
            }
            user.save()
            .then((user) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(user);                
            }, (err) => next(err));
        }
        else {
            err = new Error('User ' + req.params.userId + ' not found');
            err.status = 404;
            return next(err);
        }
    }, (err) => next(err))
    .catch((err) => next(err));   
});

router.route('/:userId/wishlist/:productId')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, (req,res,next) => {
    User.findById(req.params.userId)
    .populate('wishlist')
    .then((user) => {
        if (user != null && user.wishlist.id(req.params.productId) != null) {

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(user.orders.id(req.params.orderId));
        }
        else if (user == null) {
            err = new Error('User' + req.params.userId + ' not found');
            err.status = 404;
            return next(err);
        }
        else {
            err = new Error('Product ' + req.params.productId + ' not found');
            err.status = 404;
            return next(err);            
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})
.post(cors.corsWithOptions, (req, res, next) => {
    res.statusCode = 403;
    res.end('POST operation not supported on /users/'+ req.params.userId
        + '/wishlist/' + req.params.productId);
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /users/'+ req.params.userId
        + '/wishlist/' + req.params.productId);
})
.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    User.findById(req.params.userId)
    .populate('wishlist')
    .then((user) => {
        if (user != null && user.wishlist.id(req.params.productId) != null) {
            // if(req.user._id.equals(category.subCategories.id(req.params.subCategorytId).author)){
                user.wishlist.id(req.params.productId).remove();
                user.save()
                .then((user) => {
                    user.findById(user._id).populate('orders').populate('wishlist').populate('cart.varient').then(user =>{
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.json(user);
                    })
                                    
                }, (err) => next(err));
            // }
            // else{
            //     err = new Error('Only author can update a comment');
            //     err.status = 403;
            //     return next(err);
            // }
            
        }
        else if (user == null) {
            err = new Error('User ' + req.params.userId + ' not found');
            err.status = 404;
            return next(err);
        }
        else {
            err = new Error('Product ' + req.params.productId + ' not found');
            err.status = 404;
            return next(err);            
        }
    }, (err) => next(err))
    .catch((err) => next(err));
});


router.route('/:userId/contacts')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, (req,res,next) => {
    User.findById(req.params.userId)
    .then((user) => {
        if (user != null) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(user.contactNumbers);
        }
        else {
            err = new Error('User ' + req.params.userId + ' not found');
            err.status = 404;
            return next(err);
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
  User.findById(req.params.userId)
    .then((user) => {
        if (user != null) {
            // req.body.author = req.user._id;
            user.contacts.push(req.body.contactNumber);
            user.save()
            .then((user) => {
                User.findById(user._id).populate('wishlist').populate('orders').populate('cart.varient').then(user =>{
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(user); 
                })
                               
            }, (err) => next(err));
        }
        else {
            err = new Error('User ' + req.params.userId + ' not found');
            err.status = 404;
            return next(err);
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /users/'
        + req.params.userId + '/wishlist');
})
.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
  User.findById(req.params.userId)
    .then((user) => {
        if (user != null) {
            for (var i = (user.contacts.length -1); i >= 0; i--) {
                user.contacts[i].remove();
            }
            user.save()
            .then((user) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(user);                
            }, (err) => next(err));
        }
        else {
            err = new Error('User ' + req.params.userId + ' not found');
            err.status = 404;
            return next(err);
        }
    }, (err) => next(err))
    .catch((err) => next(err));   
});

router.post('/:userId/changepassword', function(req, res) {

  User.findOne({ _id: req.params.userId },(err, user) => {
    // Check if error connecting
    if (err) {
      res.json({ success: false, message: err }); // Return error
    } else {
      // Check if user was found in database
      if (!user) {
        res.json({ success: false, message: 'User not found' }); // Return error, user was not found in db
      } else {
        user.changePassword(req.body.oldpassword, req.body.newpassword, function(err) {
           if(err) {
                    if(err.name === 'IncorrectPasswordError'){
                         res.json({ success: false, message: 'Incorrect password' }); // Return error
                    }else {
                        res.json({ success: false, message: 'Something went wrong!! Please try again after sometimes.' });
                    }
          } else {
            res.json({ success: true, message: 'Your password has been changed successfully' });
           }
         })
      }
    }
  });
});

module.exports = router;
