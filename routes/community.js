const mongodb_database = process.env.MONGODB_DATABASE;
const express = require('express');
const router = express.Router();
var { database } = require('../databaseConnection');
const postCollection = database.db(mongodb_database).collection('posts');
const mongoose = require('mongoose');
const ObjectID = mongoose.Types.ObjectId;
const Post = require('../models/post');


function requireLogin(req, res, next) {
  if (!req.session.authenticated) {
    res.redirect('/login');
  } else {
    next();
  }
}

router.get('/', requireLogin, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = 5;
  const skip = (page - 1) * pageSize;

  try {
    const posts = await postCollection.find().sort({date: -1}).skip(skip).limit(pageSize).toArray();
    const totalPosts = await postCollection.countDocuments();
    const totalPages = Math.ceil(totalPosts / pageSize);

    res.render('community', {posts: posts, totalPages: totalPages, currentPage: page, title:'Community'});
  } catch (err) {
    console.log(err);
    console.error(err);
    res.send('Error while fetching posts');
  }
});


router.get('/:postId/details', requireLogin, async (req, res) => {
  const postId = new ObjectID(req.params.postId);

  try {
    const post = await postCollection.findOne({ _id: postId });
    res.render('post', { post: post });
  } catch (err) {
    console.error(err);
    res.send('Error while fetching post details');
  }
});


router.post('/', async (req, res) => {
  const newPost = {
    author: req.body.author,
    title: req.body.title,
    content: req.body.content,
    date: new Date(),
    preview: req.body.content.split('\n').slice(0, 4).join('\n') + '...',
    likes: [] // Make sure this line is there
  };

  try {
    await postCollection.insertOne(newPost);
    res.redirect('/community');
  } catch (err) {
    console.log(err);
    res.send('Error while inserting post');
  }
});




router.post('/write', function(req, res) {
  const { title, author, content } = req.body;

  const newPost = {
      title: title,
      author: author,
      content: content,
      date: new Date(),
      preview: content.split('\n').slice(0, 4).join('\n') + '...'
  };

  postCollection.insertOne(newPost)
      .then(result => {
          console.log('Post added successfully');
          res.redirect('/community');
      })
      .catch(error => console.error(error));
});

// router.get('/write', requireLogin, (req, res) => {
//   res.render('communitywrite', {title: "Community Post"});
// });

router.post("/like/:id", async (req, res) => {
  try {
    const username = req.session.username;
    if (!username) {
      return res.json({ success: false, message: "Please log in." });
    }
    const post = await Post.findOne({ _id: req.params.id });
    if (!post) {
      return res.json({ success: false, message: "Post not found." });
    }
    
    // post.likers 값이 정의되지 않은 경우에는 기본값으로 빈 배열 [] 할당
    post.likers = post.likers || [];
    
    const alreadyLiked = post.likers.includes(username);
    // 나머지 코드...
    

    if (alreadyLiked) {
      // 이미 좋아요를 누른 경우 좋아요 취소
      post.likers = post.likers.filter((liker) => liker !== username);
    } else {
      // 좋아요 추가
      post.likers.push(username);
    }

    await post.save();
    return res.json({ success: true, likeCount: post.likers.length });
  } catch (err) {
    console.error(err);
    res.status(500).send(err);
  }
});




module.exports = router;
