const express = require('express');
const path = require('path');
//const morgan = require('morgan');
const bodyParser = require('body-parser');
const dotenv =  require('dotenv');
const session = require('express-session');
const passport = require('passport');
dotenv.config();

//Setting up Database
const {mongoose} = require('./db/mongoose');

//Initialize express
const app = express();

//Passport config
require('../config/passport')(passport);

//Setup Port
const port = process.env.PORT || 3000;

//Redirect to https protocol from http after google oauth2 in production.
app.configure('production', () => {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https')
      res.redirect(`https://${req.header('host')}${req.url}`);
    else
      next()
  })
});

// app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

//Express Session
app.use(session({
  secret: process.env.EXPRESS_SESSION_SECRET,
  resave: true,
  saveUninitialized: true
}));

//Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

//Flash Message
app.use(require('connect-flash')());
app.use(function (req, res, next) {
  res.locals.messages = require('express-messages')(req, res)();
  next();
});

//app.use(morgan('dev'));

app.use(express.static(path.join(__dirname, '../public')));

let handlebars = require('express-handlebars').create({
  layoutsDir: path.join(__dirname, "../views/layouts"),
  partialsDir: path.join(__dirname, "../views/partials"),
  defaultLayout: 'main',
  extname: 'hbs',
  helpers: {
    auth: function(userId, creatorId, options) {
      if (arguments.length < 3)
        throw new Error("Handlebars Helper equal needs 2 parameters");
      if(!userId || !creatorId){
        return options.inverse(this);
      }
      if (userId.toString() !== creatorId.toString()) {
        return options.inverse(this);
      } else {
        return options.fn(this);
      }
    }
  }
});

app.engine('hbs', handlebars.engine);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, "../views"));

// Routes
app.use('/', require('./../routes/index.js'));
app.use('/stories', require('./../routes/stories.js'));
app.use('/users', require('./../routes/users.js'));

//Handle 404 error
app.get('*', (req, res) => {
  res.render('404', {layout: false});
});

app.listen(port, console.log(`Server started on port ${port}`));