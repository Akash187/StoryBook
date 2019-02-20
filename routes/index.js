const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary');
const cloudinaryStorage = require("multer-storage-cloudinary");

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
    if (err) {
      console.log('first err', err);
      res.send({
        msg: err
      });
    } else {
      if (req.file === undefined) {
        res.status(400).send({
          msg: 'Error: Unable to upload File!'
        });
      } else {
        console.log('File Uploaded!');
        console.log(req.file); // to see what is returned to you
        console.log(req.body);
        const image = {};
        image.url = req.file.url;
        image.id = req.file.public_id;
        res.redirect('/users/login');
        // cloudinary.uploader.destroy(image.id, function(result) { console.log(result) });
        // Image.create(image) // save image information in database
        //   .then(newImage => res.json(newImage))
        //   .catch(err => console.log(err));
      }
    }
  });
});

// Welcome Page
router.get('/', (req, res) => res.render('home', {title: 'Home Page'}));

//Dashboard Page
router.get('/dashboard', (req, res) => res.render('dashboard', {title: 'Dashboard Page'}));

//Add Page
router.get('/add', (req, res) => res.render('add', {title: 'Add Page'}));

//About Page
router.get('/about', (req, res) => res.render('about', {title: 'About Page'}));

//Show Page
router.get('/show/:id', (req, res) => res.render('show', {title: 'Detail Page'}));

module.exports = router;