const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary');
const cloudinaryStorage = require("multer-storage-cloudinary");
const passport = require('passport');

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
  transformation: [{width: 480, height: 480, crop: "fill"}]
});

const parser = multer({storage: storage}).single("myImage");

router.post('/register', (req, res) => {
  parser(req, res, (err) => {
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
      let user = new User({
        name : req.body.name,
        profileImg,
        email: req.body.email,
        password: req.body.password,
      });
      user.save().then((savedUser) => {
        res.redirect('/');
        //res.render('login', {title: 'Login Page', msg: "SignUp Successful.", msgColor: "green-text"});
      }).catch((e) => {

        //delete the uploaded image
        let imageId = req.file.public_id;
        cloudinary.uploader.destroy(imageId, function(result) { console.log(result) });

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
  passport.authenticate('local', {
    successRedirect: '/stories/dashboard',
    failureRedirect: '/users/login'
  })(req, res, next);
});

module.exports = router;
