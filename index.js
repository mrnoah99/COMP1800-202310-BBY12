require("./utils.js");

require("dotenv").config();
const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const MongoClient = require('mongodb').MongoClient;
const formidable = require('formidable');
const multer = require('multer');
const path = require("path");
const mime = require('mime');
var { database } = require("./databaseConnection");
const mongoose = require("mongoose");
const ObjectID = mongoose.Types.ObjectId;


const upload = multer({ dest: 'public/uploads/' });

const bcrypt = require("bcrypt");
const saltRounds = 12;
var gamesJSONData;

const app = express();

const Joi = require("joi");
const { TextEncoder } = require("util");
const expireTime = 24 * 60 * 60 * 1000;

// Configuring the view engine for an Express.js application to be EJS
app.set('view engine', 'ejs');
app.use(express.static("public"));

/* secret information section */
const mongodb_host = process.env.MONGODB_HOST;
const mongodb_user = process.env.MONGODB_USER;
const mongodb_password = process.env.MONGODB_PASSWORD;
const mongodb_database = process.env.MONGODB_DATABASE;
const mongodb_session_secret = process.env.MONGODB_SESSION_SECRET;

const node_session_secret = process.env.NODE_SESSION_SECRET;
/* END secret section */


const userCollection = database.db(mongodb_database).collection("users");
const postCollection = database.db(mongodb_database).collection("posts");

const port = process.env.PORT || 3200;

app.use(express.urlencoded({ extended: false }));

var mongoStore = MongoStore.create({

  mongoUrl: `mongodb+srv://${mongodb_user}:${mongodb_password}@${mongodb_host}/${mongodb_database}?retryWrites=true&w=majority`,
  crypto: {
    secret: mongodb_session_secret
  }
})

app.use(session({
  secret: node_session_secret,
  store: mongoStore, //default is memory store 
  saveUninitialized: false,
  resave: true
}
));

// Gets the 55,000 games dataset loaded into a variable accessible by the rest of index.js
const fs = require("fs");
fs.readFile("public/datasets/steam_games_test.json", 'UTF-8', (err, data) => {
  if (err) {
    console.error("Error reading file: ", err);
    return;
  }

  try {
    gamesJSONData = JSON.parse(data);
    console.log("All games:\n" + gamesJSONData);
  } catch (error) {
    console.error("Error parsing JSON: ", error);
  }
});

app.get("/", (req, res) => {
  if (!req.session.authenticated) {
    const errorMsg = req.query.errorMsg;
    console.log(errorMsg)
    res.redirect("/login");
  } else {
    res.render("index", { title: "Home Page" });
  }
});

app.get("/login", (req, res) => {
  if (!req.session.authenticated) {
    const errorMsg = req.query.errorMsg;
    res.render("login", { errorMsg });
  } else {
    res.redirect("/");
  }
});

app.post("/loginSubmit", async (req, res) => {

  var email = req.body.email;
  var password = req.body.password;

  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().max(20).required(),
  });

  const validationResult = schema.validate({ email, password });
  if (validationResult.error != null) {
    console.log(validationResult.error);
    res.redirect("/login");
    return;
  }

  const result = await userCollection.find({ email: email }).project({ email: 1, password: 1, _id: 1, username: 1 }).toArray();

  console.log(result);
  if (result.length != 1) {
    console.log("User is not found...");
    res.redirect("/login");
    return;
  }
  if (await bcrypt.compare(password, result[0].password)) {
    console.log("right password");

    req.session.authenticated = true;
    req.session.username = result[0].username;
    req.session.cookie.maxAge = expireTime;

    res.redirect("/");
    return;
  } else {
    console.log("wrong password");
    res.redirect("/login?errorMsg=Invalid email/password combination.");
    return;
  }
});

app.get('/nosql-injection', async (req, res) => {
  var name = req.query.user;

  if (!name) {
    res.send(`<h3>no user provided - try /nosql-injection?user=name</h3> <h3>or /nosql-injection?user[$ne]=name</h3>`);
    return;
  }
  //console.log("user: "+name);

  const schema = Joi.string().max(100).required();
  const validationResult = schema.validate(name);

  var invalid = false;
  //If we didn't use Joi to validate and check for a valid URL parameter below
  // we could run our userCollection.find and it would be possible to attack.
  // A URL parameter of user[$ne]=name would get executed as a MongoDB command
  // and may result in revealing information about all users or a successful
  // login without knowing the correct password.
  if (validationResult.error != null) {
    invalid = true;
    console.log(validationResult.error);
    //    res.send("<h1 style='color:darkred;'>A NoSQL injection attack was detected!!</h1>");
    //    return;
  }
  var numRows = -1;
  //var numRows2 = -1;
  try {
    const result = await userCollection.find({ name: name }).project({ username: 1, password: 1, _id: 1 }).toArray();
    //const result2 = await userCollection.find("{name: "+name).project({username: 1, password: 1, _id: 1}).toArray(); //mongoDB already prevents using catenated strings like this
    //console.log(result);
    numRows = result.length;
    //numRows2 = result2.length;
  }
  catch (err) {
    console.log(err);
    res.send(`<h1>Error querying db</h1>`);
    return;
  }

  console.log(`invalid: ${invalid} - numRows: ${numRows} - user: `, name);

  // var query = {
  //     $where: "this.name === '" + req.body.username + "'"
  // }

  // const result2 = await userCollection.find(query).toArray(); //$where queries are not allowed.

  // console.log(result2);

  res.send(`<h1>Hello</h1> <h3> num rows: ${numRows}</h3>`);
  //res.send(`<h1>Hello</h1>`);

});

app.get("/signup", (req, res) => {
  res.render("signup");
});

let remainingQuantity = 10;

app.post("/signupSubmit", async (req, res) => {
  var username = req.body.username;
  var password = req.body.password;
  var email = req.body.email;
  var phone = req.body.phone;

  const schema = Joi.object({
    username: Joi.string().alphanum().max(20).required(),
    password: Joi.string().max(20).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().pattern(/^(\()?\d{3}(\))?(-|\s)?\d{3}(-|\s)\d{4}$/).required(),
  });

  const validationResult = schema.validate({ username, email, password, phone });
  if (validationResult.error != null) {
    console.log(validationResult.error);
    res.redirect("/signup");
    req.session.cdKeys = cdKeys;
    return;
  }


  await userCollection.insertOne({
    username: username,
    password: password,
    email: email,
    phone: phone,
  });
  console.log("User has been inserted");

  req.session.authenticated = true;
  req.session.username = username;
  req.session.remainingQuantity = 10
  req.session.remainingQuantity = remainingQuantity;
  res.redirect("/event");
});

app.post("/getCDKey", async (req, res) => {
  if (!req.session.authenticated) {
    res.status(401).send("Unauthorized");
    return;
  }
});

function requireLogin(req, res, next) {
  if (!req.session.authenticated) {
    res.redirect("/login");
  } else {
    next();
  }
}

app.get("/community", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = 5;
  const skip = (page - 1) * pageSize;

  try {
    const posts = await postCollection.find({}).sort({ date: -1 }).skip(skip).limit(pageSize).toArray();
    const totalPosts = await postCollection.countDocuments();
    const totalPages = Math.ceil(totalPosts / pageSize);

    res.render("community", { posts: posts, totalPages: totalPages, currentPage: page, title: "Community" });
  } catch (err) {
    console.log(err);
    console.error(err);
    res.send("Error while fetching posts");
  }
});

app.get("/community/:postId/details", requireLogin, async (req, res) => {
  const postId = new ObjectID(req.params.postId);

  try {
    const post = await postCollection.findOne({ _id: postId });
    const likes = post && Array.isArray(post.likes) ? post.likes.length : 0;
    res.render("post", { post: post, likes: likes, title: "Community" });
  } catch (err) {
    console.error(err);
    res.send("Error while fetching post details");
  }
});


app.post("/community", async (req, res) => {
  const newPost = {
    author: req.body.author,
    title: req.body.title,
    content: req.body.content,
    date: new Date(),
    preview: req.body.content.split('\n').slice(0, 4).join('\n') + '...',
    likes: [] 
  };

  try {
    await postCollection.insertOne(newPost);
    res.redirect("/community");
  } catch (err) {
    console.log(err);
    res.send("Error while inserting post");
  }
});

app.post("/community/write", async (req, res) => {
  const { title, author, content, password } = req.body;

  console.log(`Stored password: ${password}`); 

  const newPost = {
    title: title,
    author: author,
    content: content,
    password: password,
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


app.get("/community/write", requireLogin, (req, res) => {
  res.render("communitywrite",{title: "Community"});
});


const PostSchema = mongoose.Schema({
  author: String,
  title: String,
  content: String,
  likes: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "User",
    default: [],
  },
});

const Post = mongoose.model("Post", PostSchema);

app.get("/community/:postId/details", requireLogin, async (req, res) => {
  const postId = new ObjectID(req.params.postId);

  try {
    const post = await postCollection.findOne({ _id: postId });
    res.render("post", { post: post, likes: post.likes.length, title: "Community" });
  } catch (err) {
    console.error(err);
    res.send("Error while fetching post details");
  }
});

app.get("/community/:postId/like", requireLogin, async (req, res) => {
  const postId = new ObjectID(req.params.postId);

  try {
    const post = await postCollection.findOne({ _id: postId });
    const likes = post && Array.isArray(post.likes) ? post.likes.length : 0;
    res.json({ success: true, likes: likes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error while fetching like count" });
  }
});


app.post("/community/:postId/like", requireLogin, async (req, res) => {
  const postId = new ObjectID(req.params.postId);
  const userId = req.session.userId;

  try {
    const post = await postCollection.findOne({ _id: postId });

    let index = -1;

    if (post && Array.isArray(post.likes)) {
      index = post.likes.indexOf(userId);
    } else {
      post.likes = [];
    }

    if (index > -1) {
      post.likes.splice(index, 1);
    } else {
      post.likes.push(userId);
    }

    await postCollection.updateOne({ _id: postId }, { $set: { likes: post.likes } });

    res.json({ success: true, likes: post.likes.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error while processing like" });
  }
});


app.post('/community/:postId/delete', async (req, res) => {
  const postId = req.params.postId;
  const password = req.body.password;

  try {
      const post = await Post.findOne({_id: postId});

      if (password === post.password) {
          await Post.deleteOne({_id: postId});
          res.json({ success: true, message: "Post deleted successfully" });
      } else {
          res.json({ success: false, message: "Incorrect password" });
      }

  } catch (error) {
      console.log(error);
      res.json({ success: false, message: "An error occurred" });
  }
});


app.post('/community/:id/check-password', async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;

  console.log(`Requested password: ${password}`);

  try {
    const post = await postCollection.findOne({ _id: new ObjectID(id) });

    if (!post) {
      res.json({ success: false, message: 'Post not found.' });
      return;
    }

    if (password === post.password) {
      res.json({ success: true });
    } else {
      res.json({ success: false, message: 'Password does not match.' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error while checking password' });
  }
});

app.listen(port, () => {
  console.log("Node application listening on port " + port);
});
