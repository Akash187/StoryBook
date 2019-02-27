const express = require('express');
const router = express.Router();
const {ensureAuthenticated} = require('../config/auth');

// Welcome Page
router.get('/', (req, res) => res.redirect('/stories'));

//About Page
router.get('/about',ensureAuthenticated, (req, res) => res.render('about', {title: 'About'}));

//Get Dashboard Page
router.get('/dashboard/:id', (req, res) => res.render('dashboard', {title: 'Dashboard Page'}));

module.exports = router;