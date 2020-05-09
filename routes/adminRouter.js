var express = require('express');
const bodyParser = require('body-parser');
var Admin = require('../models/admin');
// var User = require('../models/user');
var passport = require('passport');
const cors = require('./cors');

var authenticate = require('../authenticate');

var adminRouter = express.Router();
adminRouter.use(bodyParser.json());


/* GET users listing. */
adminRouter.options('/', cors.corsWithOptions, (req, res) => { res.sendStatus(200); });
adminRouter.get('/', cors.cors,authenticate.verifyUser, authenticate.verifyAdmin, function(req, res, next) {
  Admin.find({})
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

adminRouter.post('/signup', cors.corsWithOptions, (req, res, next) => {
  Admin.register(new Admin({email: req.body.email}), 
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
      user.save((err,user)=>{
        if(err){
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.json({err: err});
          return;
        }
        passport.authenticate('adminLocal')(req, res, () => {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.json({success: true, status: 'Registration Successful!'});
        });
      });
      
    }
  });
});

// router.post('/login', passport.authenticate('local'), (req, res) => {
//   res.statusCode = 200;
//   res.setHeader('Content-Type', 'application/json');
//   res.json({success: true, status: 'You are successfully logged in!'});
// });

adminRouter.post('/login', cors.corsWithOptions, (req, res, next) => {

  passport.authenticate('adminLocal', (err, user, info) => {
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

adminRouter.post('/:adminId/changepassword', function(req, res) {

  Admin.findOne({ _id: req.params.adminId },(err, user) => {
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

adminRouter.route('/:userId')
.options(cors.corsWithOptions,authenticate.verifyUser, authenticate.verifyAdmin, (req, res) => { res.sendStatus(200); })
.get(cors.cors, (req,res,next) => {
    Admin.findById(req.params.userId)
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
    Admin.findByIdAndUpdate(req.params.userId,{
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
    Admin.findByIdAndRemove(req.params.userId).then(response =>{
        res.statusCode =200;
        res.setHeader('Content-Type', 'application/json');
        res.json(response); 
    }, err =>{
        next(err);
    }).catch(err =>{
        next(err);
    });
});


module.exports = adminRouter;