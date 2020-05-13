var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var User = require('./models/user');
var Admin = require('./models/admin');

var JwtStrategy = require('passport-jwt').Strategy;
var ExtractJwt = require('passport-jwt').ExtractJwt;
var jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens

var config = require('./config.js');

// var FacebookTokenStrategy = require('passport-facebook-token');
// passport.use(new localStrategy({
//   usernameField: 'email'
// }));
exports.local = passport.use('local',new LocalStrategy({usernameField:'email',},User.authenticate()));
exports.adminLocal = passport.use('adminLocal', new LocalStrategy({usernameField:'email',}, Admin.authenticate()));
// passport.serializeUser(Admin.serializeUser());
// passport.deserializeUser(Admin.deserializeUser());
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

passport.serializeUser((obj, done) => {
    if (obj instanceof Admin) {
      done(null, { id: obj.id, type: 'Admin' });
    } else {
      done(null, { id: obj.id, type: 'User' });
    }
  });
  
  passport.deserializeUser((obj, done) => {
    if (obj.type === 'Admin') {
      Admin.get(obj.id).then((admin) => done(null, admin));
    } else {
      User.get(obj.id).then((user) => done(null, user));
    }
  });

exports.getToken = function(user) {
    return jwt.sign(user, config.secretKey,
        {expiresIn: 7200});
};

var opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = config.secretKey;

exports.jwtPassport = passport.use(new JwtStrategy(opts,
    (jwt_payload, done) => {
        console.log("JWT payload: ", jwt_payload);
        User.findById(jwt_payload._id).then(user =>{
            if(user != null){
                User.findOne({_id: jwt_payload._id}, (err, user) => {
                    if (err) {
                        return done(err, false);
                    }
                    else if (user) {
                        return done(null, user);
                    }
                    else {
                        return done(null, false);
                    }
                });
            }
            else{
                Admin.findById(jwt_payload._id).then(user =>{
                    if(user != null){
                        Admin.findOne({_id: jwt_payload._id}, (err, user) => {
                            if (err) {
                                return done(err, false);
                            }
                            else if (user) {
                                return done(null, user);
                            }
                            else {
                                return done(null, false);
                            }
                        });
                    }
                    else{
                        return done(null, false);
                    }
                });
            }
        },err =>{
            return done(err, false);
        });
        
        
    }));

exports.verifyAdmin = function(req, res, next) {
    Admin.findOne({_id: req.user._id})
    .then((user) => {
        console.log(user);
        if (user != null) {
            next();
        }
        else {
            err = new Error('You are not authorized to perform this operation!');
            err.status = 403;
            return next(err);
        } 
    }, (err) => next(err))
    .catch((err) => next(err))
}

// exports.facebookPassport = passport.use(new FacebookTokenStrategy({
//     clientID: config.facebook.clientId,
//     clientSecret: config.facebook.clientSecret
// }, (accessToken, refreshToken, profile, done) => {
//     User.findOne({facebookId: profile.id}, (err, user) => {
//         if (err) {
//             return done(err, false);
//         }
//         if (!err && user !== null) {
//             return done(null, user);
//         }
//         else {
//             user = new User({ username: profile.displayName });
//             user.facebookId = profile.id;
//             user.firstname = profile.name.givenName;
//             user.lastname = profile.name.familyName;
//             user.save((err, user) => {
//                 if (err)
//                     return done(err, false);
//                 else
//                     return done(null, user);
//             })
//         }
//     });
// }
// ));

exports.verifyUser = passport.authenticate('jwt', {session: false});