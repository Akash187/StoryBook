const express = require('express');
const router = express.Router();

// Login Page
router.get('/login', (req, res) => res.render('login', {title: 'Login Page'}));

module.exports = router;
