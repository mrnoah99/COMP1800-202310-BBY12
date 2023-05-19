const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  author: String,
  title: String,
  content: String,
  likes: { type: Number, default: 0 }
});


const Post = mongoose.model('Post', PostSchema);

module.exports = Post;
