const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary');
const cloudinaryStorage = require("multer-storage-cloudinary");
const passport = require('passport');
const mongoose = require('mongoose');

const { User } = require('../server/models/user');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = cloudinaryStorage({
  cloudinary: cloudinary,
  folder: "uploads",
  allowedFormats: ["jpg", "png", "jpeg", "gif"],
  transformation: [{width: 128, height: 128, crop: 'thumb', gravity: 'face'}]
});

const parser = multer({storage: storage}).single("myImage");

router.post('/register', (req, res) => {

  //Callback function is converted to async-await to let delete user entry if he/she previously signed up  using google OAuth then further process. I did this because Promise was not working.
  parser(req, res, async (err) => {
    let reRenderObj = {
      title: 'Login Page',
      signupActive: 'active',
      name: req.body.name,
      signupEmail: req.body.email,
      signupPassword: req.body.password,
      msgColor: 'red-text'
    };
    if (err) {
      //problem uploading file
      res.render('login', {...reRenderObj, msg: err.message});
    } else {
      let profileImg = "/images/user.png";
      if (req.file !== undefined) {
        profileImg = req.file.secure_url;
      }
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

      //Id of user previously signed in using google OAuth2 and now want to register
      let previousId = '';

      //Find out if user have previously signed up using google OAuth and Delete them
      try {
        let currentUser = await User.findOne({email: req.body.email});
        if(currentUser.strategy === 'google'){
          try {
            console.log("CurrentUser Id : ",currentUser._id);
            let deletedUser = await User.findOneAndDelete({_id: currentUser._id});
            previousId = deletedUser._id;
          } catch(e) {
            console.log("Unable to delete User :", e);
          }
        }
      }catch(e){
        console.log("Unable to find User ", e);
      }

      let userObj = {
        name : req.body.name,
        profileImg,
        backgroundImg: backgroundImages[Math.floor(Math.random()*backgroundImages.length)],
        email: req.body.email,
        password: req.body.password,
      };

      //checking if previousId not empty (that mean user previously signed up using google Oauth) then update userObj
      if(previousId){
        userObj = {_id: previousId, ...userObj};
      }

      let user = new User(userObj);

      //Try to save as new User
      user.save().then((savedUser) => {
        console.log(savedUser);
        req.flash("green-text", "Welcome to StoryBook.");
        res.redirect('/stories/dashboard');
        //res.render('login', {title: 'Login Page', msg: "SignUp Successful.", msgColor: "green-text"});
      }).catch((e) => {
        //delete the uploaded image
        if(req.file) {
          let imageId = req.file.public_id;
          cloudinary.uploader.destroy(imageId, function (result) {
            console.log(result)
          });
        }
        //show message on error
        if(e.code === 11000 || e.code === 11001){
          res.render('login', {...reRenderObj, msg: "Email Already Exist.", msgColor: "white-text"});
        }else if(e.errors.hasOwnProperty('email')){
          res.render('login', {...reRenderObj, msg: "Email not valid."});
        }else if(e.errors.hasOwnProperty('password')){
          res.render('login', {...reRenderObj, msg: "Password must be minimum 6 character long."});
        }else{
          res.render('login', {...reRenderObj, msg: "Unable to SignUp. Try after sometime.", msgColor: "white-text"});
        }
      });
    }
  });
});

// Login Page
router.get('/login', (req, res) => res.render('login', {title: 'Login Page'}));

//Login Handle
router.post('/login', (req, res, next) => {
  console.log(req.body);
  passport.authenticate('local', function(err, user, info) {
    console.log("info", info);
    if (err) { return next(err); }
    if (!user) {
      return res.render('login', {email: req.body.email, password: req.body.password, msg: info.message, msgColor: "red-text"});
    }
    req.logIn(user, function(err) {
      if (err) { return next(err); }
      req.flash("green-text", "Login Successful!.");
      return res.redirect('/stories/dashboard/');
    });
  })(req, res, next);
});

//Google Oauth Login
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'https://www.googleapis.com/auth/userinfo.email']
}));

// callback route for google to redirect to
// hand control to passport to use code to grab profile info
router.get('/google/redirect', (req, res, next) => {
  passport.authenticate('google', (err, user, info) => {
    if (err) { return next(err); }
    if (!user) {
      return res.render('login', {email: req.body.email, password: req.body.password, msg: info.message, msgColor: "red-text"});
    }
    req.logIn(user, function(err) {
      if (err) { return next(err); }
      req.flash("green-text", "Login Successful!.");
      return res.redirect('/stories/dashboard/');
    });
  })(req, res, next);
});

router.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

module.exports = router;