const express = require('express');
const bodyParser = require('body-parser');
const app = express();

const path = require('path');

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: false }));

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  username: String,
  password: String,
  // include other properties as required
});

const User = mongoose.model('User', UserSchema);


mongoose.connect('mongodb://localhost/COMP2800-BBY-12', { useNewUrlParser: true, useUnifiedTopology: true });

const session = require('express-session');

app.use(session({
  secret: 'your secret key',
  resave: false,
  saveUninitialized: true
}));

app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', async (req, res) => {
  const user = await User.findOne({ username: req.body.username, password: req.body.password });
  if (user) {
    req.session.user = user;
    res.redirect('/');
  } else {
    res.redirect('/login');
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

app.get('/', (req, res) => {
  if (req.session.user) {
    res.send('Welcome, ' + req.session.user.username);
  } else {
    res.redirect('/login');
  }
});

app.listen(3000, () => console.log('Server is running on port 3000'));
