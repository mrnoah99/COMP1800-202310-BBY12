const express = require('express');
const router = express.Router();
const Post = require('../models/post');

router.post('/:postId/delete', async (req, res) => {
  const postId = req.params.postId;
  const password = req.body.password;

  try {
    const post = await Post.findOne({ _id: postId });

    if (post && password === post.password) {
      await Post.deleteOne({ _id: postId });
      res.json({ success: true, message: "Post deleted successfully" });
    } else {
      res.json({ success: false, message: "Incorrect password" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "An error occurred" });
  }
});

module.exports = router;
