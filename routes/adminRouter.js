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

// router.post('/signup', (req, res, next) => {
//   User.findOne({username: req.body.username})
//   .then((user) => {
//     if(user != null) {
//       var err = new Error('User ' + req.body.username + ' already exists!');
//       err.status = 403;
//       next(err);
//     }
//     else {
//       return User.create({
//         username: req.body.username,
//         password: req.body.password});
//     }
//   })
//   .then((user) => {
//     res.statusCode = 200;
//     res.setHeader('Content-Type', 'application/json');
//     res.json({status: 'Registration Successful!', user: user});
//   }, (err) => next(err))
//   .catch((err) => next(err));
// });

// router.post('/login', (req, res, next) => {

//   if(!req.session.user) {
//     var authHeader = req.headers.authorization;
    
//     if (!authHeader) {
//       var err = new Error('You are not authenticated!');
//       res.setHeader('WWW-Authenticate', 'Basic');
//       err.status = 401;
//       return next(err);
//     }
  
//     var auth = new Buffer.from(authHeader.split(' ')[1], 'base64').toString().split(':');
//     var username = auth[0];
//     var password = auth[1];
  
//     User.findOne({username: username})
//     .then((user) => {
//       if (user === null) {
//         var err = new Error('User ' + username + ' does not exist!');
//         err.status = 403;
//         return next(err);
//       }
//       else if (user.password !== password) {
//         var err = new Error('Your password is incorrect!');
//         err.status = 403;
//         return next(err);
//       }
//       else if (user.username === username && user.password === password) {
//         req.session.user = 'authenticated';
//         res.statusCode = 200;
//         res.setHeader('Content-Type', 'text/plain');
//         res.end('You are authenticated!')
//       }
//     })
//     .catch((err) => next(err));
//   }
//   else {
//     res.statusCode = 200;
//     res.setHeader('Content-Type', 'text/plain');
//     res.end('You are already authenticated!');
//   }
// })
// passport.use(new localStrategy({
//   usernameField: 'email'
// }));

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

module.exports = adminRouter;