const express = require('express');
const router = express.Router();
const sanitizeHtml = require("sanitize-html");
const moment = require('moment');
const {ensureAuthenticated} = require('../config/auth');

const {Story} = require('../server/models/story');
const {User} = require('../server/models/user');

// Welcome Page
router.get('/', async (req, res) => {
  try {
    let stories = await Story.find({status: 'public'}).sort({createdAt: -1});
    let pArray = stories.map(async (story) => {
      let user = await User.findOne({_id: story._creator});
      return {
        createdAt: moment.unix(story.createdAt).format("MMMM Do YYYY"),
        _id: story._id,
        storyTitle: story.storyTitle,
        _creator: story._creator,
        creator: user.name,
        profileImg: user.profileImg
      }
    });
    const publicStories = await Promise.all(pArray);
    res.render('home', {title: 'Stories', pageTitle: 'Public Stories', stories: publicStories, user: req.user});


    //Synchronous way of getting public Stories
    // let publicStories = [];
    // for(let story of stories){
    //   let user = await User.findOne({_id: story._creator});
    //   publicStories.push({
    //     createdAt: moment.unix(story.createdAt).format("MMMM Do YYYY"),
    //     _id: story._id,
    //     storyTitle: story.storyTitle,
    //     creator: user.name,
    //     profileImg: user.profileImg
    //   });
    // }
    // console.log("publicStories : ", publicStories);
  }catch(e){
    console.log(e);
    res.status(400).send(e);
  }
});

//Get Dashboard Page
router.get('/dashboard', ensureAuthenticated, (req, res) => {
  Story.find({_creator: req.user._id})
    .sort( { createdAt: -1 })
    .then((stories) => {
      let myStories = stories.map(story =>
        (
          {
            createdAt: moment.unix(story.createdAt).format("MMMM Do YYYY"),
            _id: story._id,
            storyTitle: story.storyTitle,
            status: story.status
          }
        )
      );
      res.render('dashboard', {title: 'Dashboard', user: req.user, stories: myStories});
    }, (e) => {
      res.status(400).send(e);
    });
});

//Delete Story
router.delete('/delete/:id', ensureAuthenticated, async (req, res) => {
  let id = req.params.id;
  try{
    let deletedStory = await Story.findOneAndDelete({_id: id, _creator: req.user._id});
    console.log(deletedStory);
    if (!deletedStory) {
      return res.status(404).send();
    }
    res.send({deletedStory});
  }catch(e){
    res.status(400).send(e);
  }
});

// All stories by signed in user
router.get('/myStories', ensureAuthenticated, async (req, res) => {
  try {
    let stories = await Story.find({_creator: req.user._id}).sort({createdAt: -1});
    let pArray = stories.map(async (story) => {
      let user = await User.findOne({_id: story._creator});
      return {
        createdAt: moment.unix(story.createdAt).format("MMMM Do YYYY"),
        _id: story._id,
        storyTitle: story.storyTitle,
        _creator: story._creator,
        creator: user.name,
        profileImg: user.profileImg
      }
    });
    const publicStories = await Promise.all(pArray);
    res.render('home', {title: 'Stories', pageTitle: 'My Stories', stories: publicStories, user: req.user});
  }catch(e){
    res.status(400).send(e);
  }
});

// more public story of other user
router.get('/user/:id', async (req, res) => {
  let id = req.params.id;
  if(req.user){
    if(req.user._id.toString() === id.toString()){
      return res.redirect('/stories/myStories');
    }
  }
  try {
    let stories = await Story.find({_creator: id, status: 'public'}).sort({createdAt: -1});
    let pArray = stories.map(async (story) => {
      let user = await User.findOne({_id: story._creator});
      return {
        createdAt: moment.unix(story.createdAt).format("MMMM Do YYYY"),
        _id: story._id,
        storyTitle: story.storyTitle,
        _creator: story._creator,
        creator: user.name,
        profileImg: user.profileImg
      }
    });
    const publicStories = await Promise.all(pArray);
    res.render('home', {title: 'Stories', pageTitle: 'Stories', stories: publicStories, user: req.user});
  }catch(e){
    console.log(e);
    res.status(400).send(e);
  }
});

//Get Read Page
router.get('/read/:id', async (req, res) => {

  let id = req.params.id;

  try{
    let story = await Story.findOne({_id :id});
    if (!story) {
      return res.status(404);
    }
    let creator = await User.findOne({_id: story._creator});
    let clean = sanitizeHtml(story.content, {
      allowedTags: ['figure','img','h4', 'h5', 'h6', 'p', 'blockquote', 'i', 'strong', 'a', 'li', 'ul', 'ol','table', 'thead', 'tr', 'th', 'td', 'tbody'],
      allowedAttributes: {
        'a': [ 'href' ],
        'img': [ 'src' ],
        'th': ['colspan', 'rowspan'],
        'td': ['colspan', 'rowspan'],
        'figure': ['class']
      }
    });
    //sorting comment in descending order of date
    const sortedComment = story.comments.sort(function(a, b){
      return b.date - a.date
    });
    //Array of promises
    let pArray = sortedComment.map(async comment => {
      let user = await User.findOne({_id: comment._creator});
      console.log("User : ", user);
      return {
        body : comment.body,
        date : moment.unix(comment.date).format("MMMM Do YYYY"),
        creator: user.name,
        profileImg: user.profileImg
      }
    });

    let comments = await Promise.all(pArray);
    res.render('read',
      {
        title: 'Read Story',
        _id: story._id,
        storyTitle: story.storyTitle,
        createdAt: moment.unix(story.createdAt).format("dddd, MMMM Do YYYY"),
        content: clean,
        allowComment: story.allowComment,
        comments: comments,
        creator: creator,
        user: req.user
      });

  }catch(e) {
    console.log(e);
    res.status(400).send(e);
  }
});

//post Comment to Story
router.post('/read/addComment/:id', ensureAuthenticated, (req, res) => {
  let id = req.params.id;
  let comment = {
    body : req.body.comment,
    date : moment().unix(),
    _creator: req.user._id
  };
  Story.findOneAndUpdate({_id :id}, { $push: { comments : comment } }, {new: true})
    .then((doc) => {
      res.redirect(`/stories/read/${id}`);
    }, (e) => {
      console.log(e);
      res.status(400);
    }
    );
});

//Get Add Page
router.get('/add', ensureAuthenticated, (req, res) => res.render('addEdit',
    {
      title: 'Add Story',
      action: 'add',
      allowComment : "checked",
      upload_url: process.env.CKEDITOR5_UPLOAD_URL,
      token_url: process.env.CKEDITOR5_TOKEN_URL,
      user: req.user
    }
  )
);

//Add Story
router.post('/add', ensureAuthenticated, (req, res) => {
  let {storyTitle, status, allowComment, content} = {...req.body};
  if(typeof req.body.content === "string"){
    content = req.body.content;
  }else{
    content = req.body.content[1];
  }
  if(content === '<p>&nbsp;</p>' || content.length <= 12){
    res.render('addEdit',
      {
        title: 'Add Story',
        action: 'add',
        upload_url: process.env.CKEDITOR5_UPLOAD_URL,
        token_url: process.env.CKEDITOR5_TOKEN_URL,
        msg: 'Content must be more than 5 characters.' ,
        msgColor: 'red-text',
        storyTitle,
        content,
        status: status === 'private' ? "selected" : "random",
        allowComment: allowComment === "on" ? "checked" : "random",
        user: req.user
      });
  }else{
    let story = new Story({
      storyTitle,
      content: content,
      createdAt: moment().unix(),
      status,
      _creator: req.user._id,
      allowComment: allowComment === "on"
    });
    story.save().then((doc) => {
      req.flash("green-text", "Story added Successfully!");
      res.redirect('/stories');
    }, (e) => {
      console.log(e);
      res.status(400);
    });
  }
});

//Get Edit Page
router.get('/edit/:id', ensureAuthenticated, (req, res) => {
  let id = req.params.id;
  Story.find({_id :id, _creator: req.user._id})
    .then((story) => {
      if (!story) {
        return res.status(404);
      }
      res.render('addEdit',
        {
          title: 'Edit Story',
          action: 'edit',
          upload_url: process.env.CKEDITOR5_UPLOAD_URL,
          token_url: process.env.CKEDITOR5_TOKEN_URL,
          storyTitle: story[0].storyTitle,
          content: story[0].content,
          _id: story[0]._id,
          status: story[0].status === 'private' ? "selected" : "random",
          allowComment: story[0].allowComment ? "checked" : "random",
          user: req.user
        });
    }).catch((e) => {
      console.log(e);
      res.status(400);
  });
});

//Update Story
router.post('/edit/:id', ensureAuthenticated, (req, res) => {
  console.log(req.body);
  let id = req.params.id;
  let {storyTitle, status, allowComment, content} = {...req.body};
  if(typeof req.body.content === "string"){
    content = req.body.content;
  }else{
    content = req.body.content[1];
  }
  if(content === '<p>&nbsp;</p>' || content.length <= 12){
    res.render('addEdit',
      {
        title: 'Add Story',
        action: 'edit',
        upload_url: process.env.CKEDITOR5_UPLOAD_URL,
        token_url: process.env.CKEDITOR5_TOKEN_URL,
        _id: id,
        msg: 'Content must be more than 5 characters.' ,
        msgColor: 'red-text',
        storyTitle,
        content,
        status: status === 'private' ? "selected" : "random",
        allowComment: allowComment === "on" ? "checked" : "random",
        user: req.user
      });
  }else{
    let story = {
      storyTitle,
      content: content,
      status,
      allowComment: allowComment === "on"
    };
    Story.findOneAndUpdate(
      {_id :id, _creator: req.user._id},
      {$set: story},
      {new: true})
      .then((doc) => {
      res.redirect('/');
    }, (e) => {
      console.log(e);
      res.status(400);
    });
  }
});

module.exports = router;