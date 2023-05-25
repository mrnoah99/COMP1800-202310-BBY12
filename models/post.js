
// post.js
const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  author: String,
  title: String,
  content: String,
  likes: { type: [mongoose.Schema.Types.ObjectId], ref: "User", default: [] },
});

const Post = mongoose.model('Post', PostSchema);

module.exports = Post;
=======
const express = require('express');
const router = express.Router();
const Post = require('../models/post');

router.post('/', async (req, res) => {
    try {
        let obj;
        
        obj = {
            writer: req.body.writer,
            password: req.body.password,
            title: req.body.title,
            content: req.body.content
        };

        const post = new Post(obj);
        await post.save();
        res.json({message: "post uploaded"});

    } catch (err) {
        console.log(err);
        res.json({message: false});
    }
});

module.exports = router;

