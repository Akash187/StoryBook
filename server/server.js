const express = require('express');
const exphbs = require('express-handlebars');
const path = require('path');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const dotenv =  require('dotenv');
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(morgan('dev'));

app.use(express.static(path.join(__dirname, '../public')));
app.engine('hbs', exphbs({defaultLayout: 'main.hbs'}));
app.set('view engine', 'hbs');

// Routes
app.use('/', require('./../routes/index.js'));
app.use('/users', require('./../routes/users.js'));


app.listen(port, console.log(`Server started on port ${port}`));