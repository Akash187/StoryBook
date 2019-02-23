const express = require('express');
const router = express.Router();

const {Story} = require('../server/models/story');

// Welcome Page
router.get('/', (req, res) => res.render('dashboard', {title: 'Dashboard'}));

//About Page
router.get('/about', (req, res) => res.render('about', {title: 'About'}));

//Dashboard Page
router.get('/dashboard', (req, res) => res.render('dashboard', {title: 'Dashboard'}));


module.exports = router;