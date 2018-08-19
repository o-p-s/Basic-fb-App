var passport = require('passport');
var passport = require('passport');
var FacebookTokenStrategy = require('passport-facebook-token');
var userController= require('./../controllers/userController')

module.exports = function () {

    passport.use(new FacebookTokenStrategy({
        clientID: 'FB-APP-ID',
        clientSecret: 'FB-APP-SECRET'
      },
      function (accessToken, refreshToken, profile, done) {
        userController.upsertUser(accessToken, refreshToken, profile, function(err, user) {
          if(user)
          return done(err, user);
        });
      }));
  
  };