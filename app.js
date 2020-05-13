var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
var FileStore = require('session-file-store')(session);
var passport = require('passport');
var authenticate = require('./authenticate');
var config = require('./config');



var usersRouter = require('./routes/users');
var adminRouter = require('./routes/adminRouter');
var categoryRouter = require('./routes/categoryRouter');
var productRouter = require('./routes/productRouter');
var orderRouter = require('./routes/orderRouter');
// var varientRouter = require('./routes/varientRouter');
var uploadRouter = require('./routes/uploadRouter');
var mailRouter = require('./routes/mailRouter');

const mongoose = require('mongoose');
const categories = require('./models/categories');
const products = require('./models/products');
const orders = require('./models/orders');
// const varients = require('./models/varients');

// const url = 'mongodb://localhost:27017/conFusion';
const url = config.mongoUrl;
const connect = mongoose.connect(url);

connect.then((db)=>{
  console.log('Connected correctly to server');
}, (err)=>{
  console.log(err);
});

var app = express();

// Secure traffic only
// app.all('*', (req, res, next) => {
//   if (req.secure) {
//     return next();
//   }
//   else {
//     res.redirect(307, 'https://' + req.hostname + ':' + app.get('secPort') + req.url);
//   }
// });

// view engine setup

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(passport.initialize());
// app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/users', usersRouter);
app.use('/admin', adminRouter);




app.use('/categories', categoryRouter);
app.use('/orders', orderRouter);
app.use('/products', productRouter);
// app.use('/varients', varientRouter);
app.use('/imageUpload',uploadRouter);
app.use('/mail', mailRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.json(err.message);
});

module.exports = app;
