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