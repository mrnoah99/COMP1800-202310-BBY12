const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  nickname: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  phoneNumber: {
    type: String,
    required: true
  },
  profileImage: {
    type: String,
    required: false
  }
});

const User = mongoose.model('User', UserSchema);

module.exports = User;
