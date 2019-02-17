const express = require('express');
const router = express.Router();

// Welcome Page
router.get('/', (req, res) => res.render('home', {title: 'Home Page'}));

//About Page
router.get('/about', (req, res) => res.render('about', {title: 'About Page'}));

module.exports = router;