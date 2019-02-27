const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

//Mongoose schema for users model
let UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 1,
    trim: true
  },
  profileImg:{
    type: String,
    trim: true,
    required: true
  },
  backgroundImg:{
    type: String,
    trim: true,
    required: true
  },
  email: {
    type: String,
    required: true,
    minlength: 1,
    trim: true,
    unique: true,
    validate: {
      validator: validator.isEmail,
      message: `{Value} is not a valid email.`
    }
  },
  password: {
    type: String,
    minlength: 6
  },
  strategy: {
    type: String,
    default: 'local'

  },
  date:{
    type: Date,
    default: Date.now()
  }
});

//Mongoose Middleware
UserSchema.pre('save', function (next) {
  let user = this;
  if(user.isModified('password')){
    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(user.password, salt, (err, hash) => {
        user.password = hash;
        next();
      });
    });
  }else{
    next();
  }
});

let User = mongoose.model('User', UserSchema);

module.exports = {User};