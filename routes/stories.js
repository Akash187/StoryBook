const express = require('express');
const router = express.Router();
const sanitizeHtml = require("sanitize-html");
const moment = require('moment');

const {Story} = require('../server/models/story');

// Welcome Page
router.get('/', (req, res) => {
  Story.find({status: 'public'})
    .sort( { createdAt: -1 })
    .then((stories) => {
      const publicStories= stories.map(story =>
        (
          {createdAt: moment.unix(story.createdAt).format("MMMM Do YYYY"),
            _id: story._id,
            storyTitle: story.storyTitle,
            creator: 'Akash Kumar Seth',
            profileImg: 'https://res.cloudinary.com/akash187/image/upload/v1550547135/uploads/hy3kol8bywgruopkbkih.jpg'})
      );
      res.render('home', {title: 'Stories', pageTitle: 'Public Stories', stories: publicStories});
    }, (e) => {
      res.status(400).send(e);
    });
});

//Get Dashboard Page
router.get('/dashboard', (req, res) => res.render('dashboard', {title: 'Dashboard Page'}));

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
router.get('/add', (req, res) => res.render('addEdit', {title: 'Add Story', action: 'add', allowComment : "checked"}));

//Add Story
router.post('/add', (req, res) => {
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
        msg: 'Content must be more than 5 characters.' ,
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
      allowComment: allowComment === "on"
    });
    story.save().then((doc) => {
      res.redirect('/');
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
        _id: id,
        msg: 'Content must be more than 5 characters.' ,
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