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
    console.log("User : ", req.user);
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
      console.log("My Stories : ", myStories);
      res.render('dashboard', {title: 'Dashboard', user: req.user, stories: myStories});
    }, (e) => {
      res.status(400).send(e);
    });
});

// more public story of other user
router.get('/user/:id', (req, res) => {
  Story.find({_creator: req.param.id, status: 'public'})
    .sort( { createdAt: -1 })
    .then((stories) => {
      const publicStories = stories.map(story =>{
        let userName, profileImg;
        User.findOne({_id: story._creator}).then((user) => {
          userName = user.name;
          profileImg = user.profileImg;
        }).catch((e) => console.log("Unable to fetch User : ", e));
        return {
          createdAt: moment.unix(story.createdAt).format("MMMM Do YYYY"),
          _id: story._id,
          storyTitle: story.storyTitle,
          userName,
          profileImg
        }
      });
      res.render('home', {title: 'Stories', pageTitle: 'Stories', stories: publicStories});
    }, (e) => {
      res.status(400).send(e);
    });
});

//Get Read Page
router.get('/read/:id', (req, res) => {
  let id = req.params.id;
  Story.find({_id :id})
    .then((story) => {
      if (!story) {
        return res.status(404);
      }
      let clean = sanitizeHtml(story[0].content, {
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
      const sortedComment = story[0].comments.sort(function(a, b){
        return b.date - a.date
      });
      const Comments = sortedComment.map(comment => {
        return {
          body : comment.body,
          date : moment.unix(comment.date).format("MMMM Do YYYY")
        }
      });
      res.render('read',
        {
          user: req.user,
          title: 'Read',
          _id: story[0]._id,
          storyTitle: story[0].storyTitle,
          createdAt: moment.unix(story[0].createdAt).format("dddd, MMMM Do YYYY, h:mm:ss a"),
          content: clean,
          allowComment: story[0].allowComment,
          comments: Comments
        });
    }).catch((e) => {
    console.log(e);
    res.status(400);
  });
});

//post Comment to Story
router.post('/read/addComment/:id', (req, res) => {
  console.log("comment Body", req.body);
  let id = req.params.id;
  let comment = {
    body : req.body.comment,
    date : moment().unix()
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
      token_url: process.env.CKEDITOR5_TOKEN_URL
    }
  )
);

//Add Story
router.post('/add', ensureAuthenticated, (req, res) => {
  console.log(req.body);
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
        allowComment: allowComment === "on" ? "checked" : "random"
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
router.get('/edit/:id', (req, res) => {
  let id = req.params.id;
  Story.find({_id :id})
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
          allowComment: story[0].allowComment ? "checked" : "random"
        });
    }).catch((e) => {
      console.log(e);
      res.status(400);
  });
});

//Update Story
router.post('/edit/:id', (req, res) => {
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
        allowComment: allowComment === "on" ? "checked" : "random"
      });
  }else{
    let story = {
      storyTitle,
      content: content,
      status,
      allowComment: allowComment === "on"
    };
    Story.findOneAndUpdate(
      {_id :id},
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