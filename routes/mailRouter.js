const express = require('express');
const bodyParser = require('body-parser');
const authenticate = require('../authenticate');
const cors = require('./cors');
var nodemailer = require('nodemailer');
var config = require('../config');

const mailRouter = express.Router();

mailRouter.use(bodyParser.json());

mailRouter.route('/')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    res.statusCode = 403;
    res.end('GET operation not supported on /mail');
})
.post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res) => {
    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: config.businessEmail,
          pass: config.businessPassword
        },
        tls: {
            rejectUnauthorized: false
        }
      });
      
      var mailOptions = {
        from: config.businessEmail,
        to: req.body.email,
        subject: req.body.subject,
        text: req.body.text
      };
      
      transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.json(error.message);
        } else {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(true);
        }
      });
    
})
.put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /mail');
})
.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    res.statusCode = 403;
    res.end('DELETE operation not supported on /mail');
});


module.exports = mailRouter;