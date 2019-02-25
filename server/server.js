const express = require('express');
const path = require('path');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const dotenv =  require('dotenv');
const session = require('express-session');
const passport = require('passport');
// const cors = require('cors');
dotenv.config();

//Initialize express
const app = express();

//Passport config
require('../config/passport')(passport);

//Setup Port
const port = process.env.PORT || 3000;

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

app.use(morgan('dev'));

//Setting up Database
const {mongoose} = require('./db/mongoose');

app.use(express.static(path.join(__dirname, '../public')));

let handlebars = require('express-handlebars').create({
  layoutsDir: path.join(__dirname, "../views/layouts"),
  partialsDir: path.join(__dirname, "../views/partials"),
  defaultLayout: 'main',
  extname: 'hbs'
});

app.engine('hbs', handlebars.engine);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, "../views"));

// Routes
app.use('/', require('./../routes/index.js'));
app.use('/stories', require('./../routes/stories.js'));
app.use('/users', require('./../routes/users.js'));


app.listen(port, console.log(`Server started on port ${port}`));