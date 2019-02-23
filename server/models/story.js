const mongoose = require('mongoose');

//Mongoose model for ideas
let Story = mongoose.model('Story', {
  storyTitle: {
    type: String,
    required: true,
    minlength: 5,
    trim: true
  },
  content: {
    type: String,
    required: true,
    minlength: 5,
    trim: true
  },
  createdAt: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    default: 'public',
    required: true
  },
  allowComment: {
    type: Boolean,
    required: true
  },
  comments: [
    {
      body: {
        type: String,
        required: true
      },
      date: {
        type: Number,
        required: true
      }
    }
  ]
});

module.exports = {Story};