const mongoose = require('mongoose');

mongoose.Promise = global.Promise;
mongoose.connect(process.env.PROD_MONGODB || 'mongodb://localhost:27017/StoryBook', {useNewUrlParser: true});

module.exports = {mongoose};