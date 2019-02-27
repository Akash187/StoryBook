module.exports = {
  ensureAuthenticated: function(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    req.flash('white-text', 'Please log in to view that resource');
    res.redirect('/users/login');
  }
};
