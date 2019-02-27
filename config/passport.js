const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Load User model
const {User} = require('../server/models/user');

module.exports = function(passport) {
  passport.use(
    new LocalStrategy({ usernameField: 'email' }, (email, password, done) => {
      // Match user
      User.findOne({
        email: email
      }).then(user => {
        if (!user) {
          return done(null, false, { message: 'Email not registered' });
        }
        // Match password
        bcrypt.compare(password, user.password, (err, isMatch) => {
          if (err) throw err;
          if (isMatch) {
            return done(null, user);
          } else {
            return done(null, false, { message: 'Password incorrect' });
          }
        });
      });
    })
  );

  passport.use(
    new GoogleStrategy({
      // options for google strategy
      clientID: process.env.GOOGLE_OAUTH_CLIENT_ID,
      clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
      callbackURL: '/users/google/redirect'
    }, (accessToken, refreshToken, profile, done) => {

      User.findOne({email : profile.emails[0].value})
        .then((currentUser) => {
          if(currentUser){
            done(null, currentUser);
          }else{
            //Random background Images for users
            let backgroundImages = [
              "https://res.cloudinary.com/akash187/image/upload/v1551132131/pexels-photo-1038374.jpg",
              "https://res.cloudinary.com/akash187/image/upload/v1551132121/pexels-photo-775687.jpg",
              "https://res.cloudinary.com/akash187/image/upload/v1551132117/pexels-photo-737552.jpg",
              "https://res.cloudinary.com/akash187/image/upload/v1551132116/pexels-photo-1020315.jpg",
              "https://res.cloudinary.com/akash187/image/upload/v1551132096/pexels-photo-584302.jpg",
              "https://res.cloudinary.com/akash187/image/upload/v1551132063/pexels-photo-259915.jpg",
              "https://res.cloudinary.com/akash187/image/upload/v1551132026/beach-shoreline-coast-summer.jpg"
            ];

            //User Object
            let user = new User({
              name : profile.displayName,
              profileImg : profile.photos[0].value,
              strategy : "google",
              backgroundImg: backgroundImages[Math.floor(Math.random()*backgroundImages.length)],
              email: profile.emails[0].value,
              password: profile.id,
            });
            user.save().then((newUser) => {
              console.log('new user created: ', newUser);
              return done(null, newUser);
            });
          }
        });
    })
  );

  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });
};
