// server.js

require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const mongoose = require('mongoose');
const Post = require('./models/post');
const MongoStore = require("connect-mongo");

const app = express();
const port = process.env.PORT || 3200;

// MongoDB configuration
const mongoDBUser = process.env.MONGODB_USER;
const mongoDBPassword = process.env.MONGODB_PASSWORD;
const mongoDBHost = process.env.MONGODB_HOST;
const mongoDBDatabase = process.env.MONGODB_DATABASE;

const mongoDBConnectionString = `mongodb+srv://${mongoDBUser}:${mongoDBPassword}@${mongoDBHost}/${mongoDBDatabase}?retryWrites=true&w=majority`;

mongoose.connect(mongoDBConnectionString, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const sessionConfig = {
  secret: process.env.NODE_SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: new MongoStore({
    url: mongoDBConnectionString,
    autoRemove: 'interval',
    autoRemoveInterval: 10,
  }),
  cookie: {
    maxAge: 60 * 60 * 1000,
  },
};

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: false }));
app.use(express.json()); // This middleware is used to parse JSON bodies from the client
app.use(session(sessionConfig));

app.get('/', (req, res) => {
  res.render('index');
});

app.get('/communitywrite', (req, res) => {
  res.render('communitywrite');
});

app.post('/posts', (req, res) => {
  const post = new Post({
    authorName: req.body.authorName,
    postTitle: req.body.postTitle,
    postContent: req.body.postContent,
  });

  post.save()
    .then(result => {
      res.status(201).json(result);
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({ error: err });
    });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
