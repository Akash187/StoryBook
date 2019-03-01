const express = require('express');
const router = express.Router();

// Welcome Page
router.get('/', (req, res) => res.redirect('/stories'));

//About Page
router.get('/about', (req, res) => res.render('about', {title: 'About Page', user: req.user}));

module.exports = router;