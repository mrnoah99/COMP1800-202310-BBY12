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

var { database } = require("./databaseConnection");
const mongoose = require("mongoose");
const ObjectID = mongoose.Types.ObjectId;

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

var { database } = include("databaseConnection");

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




// const communityRouter = require('./routes/community');
// app.use('/community', communityRouter);


app.get("/signup", (req, res) => {
  res.render("signup");
});

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
    return;
  }

  var hashedPassword = await bcrypt.hash(password, saltRounds);

  await userCollection.insertOne({
    username: username,
    password: hashedPassword,
    email: email,
    phone: phone,
  });
  console.log("User has been inserted");

  req.session.authenticated = true;
  req.session.username = username;
  req.session.remainingQuantity = 10
  res.redirect("/index");
});

function requireLogin(req, res, next) {
  if (!req.session.authenticated) {
    res.redirect("/login");
  } else {
    next();
  }
}

app.get("/community", requireLogin, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = 5;
  const skip = (page - 1) * pageSize;

  try {
    const posts = await postCollection.find().sort({ date: -1 }).skip(skip).limit(pageSize).toArray();
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
    res.render("post", { post: post, title: "Community" });
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
    likes: [] // Make sure this line is there
  };

  try {
    await postCollection.insertOne(newPost);
    res.redirect("/community");
  } catch (err) {
    console.log(err);
    res.send("Error while inserting post");
  }
});

app.post("/community/write", function (req, res) {
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

app.get("/community/write", requireLogin, (req, res) => {
  res.render("communitywrite",{title: "Community"});
});

app.post("/community/like/:id", async (req, res) => {
  try {
    const username = req.session.username;
    if (!username) {
      return res.json({ success: false, message: "Please log in." });
    }
    const post = await Post.findOne({ _id: req.params.id });
    if (!post) {
      return res.json({ success: false, message: "Post not found." });
    }

    post.likers = post.likers || [];

    const alreadyLiked = post.likers.includes(username);


    if (alreadyLiked) {

      post.likers = post.likers.filter((liker) => liker !== username);
    } else {

      post.likers.push(username);
    }

    await post.save();
    return res.json({ success: true, liked: !alreadyLiked });
  } catch (error) {
    console.error(error);
    return res.json({ success: false, message: "An error occurred." });
  }
});


app.get("/redeem", (req, res) => {
  // if (!req.session.authenticated) {
  //   res.redirect("/");
  //   return;
  // }
  res.render("redeem");
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

  var hashedPassword = await bcrypt.hash(password, saltRounds);

  await userCollection.insertOne({
    username: username,
    password: hashedPassword,
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

app.get("/community", requireLogin, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = 5;
  const skip = (page - 1) * pageSize;

  try {
    const posts = await postCollection.find().sort({ date: -1 }).skip(skip).limit(pageSize).toArray();
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
    res.render("post", { post: post, title: "Community" });
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
    likes: [] // Make sure this line is there
  };

  try {
    await postCollection.insertOne(newPost);
    res.redirect("/community");
  } catch (err) {
    console.log(err);
    res.send("Error while inserting post");
  }
});

app.post("/community/write", function (req, res) {
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

app.get("/community/write", requireLogin, (req, res) => {
  res.render("communitywrite",{title: "Community"});
});

app.post("/community/like/:id", async (req, res) => {
  try {
    const username = req.session.username;
    if (!username) {
      return res.json({ success: false, message: "Please log in." });
    }
    const post = await Post.findOne({ _id: req.params.id });
    if (!post) {
      return res.json({ success: false, message: "Post not found." });
    }

    post.likers = post.likers || [];

    const alreadyLiked = post.likers.includes(username);


    if (alreadyLiked) {

      post.likers = post.likers.filter((liker) => liker !== username);
    } else {

      post.likers.push(username);
    }

    await post.save();
    return res.json({ success: true, liked: !alreadyLiked });
  } catch (error) {
    console.error(error);
    return res.json({ success: false, message: "An error occurred." });
  }
});

app.get("/redeem", async (req, res) => {
   if (!req.session.authenticated) {
     res.redirect("/");
     return;
  }
  res.render("redeem");
  const user = await userCollection.findOne({ username: req.session.username });
  if (!user || user.cdKeys.length === 0) {
    res.status(400).send("No CD keys left");
    return;
  }
  const cdKey = user.cdKeys.pop();
  await userCollection.updateOne({ username: req.session.username }, { $set: { cdKeys: user.cdKeys } });
  res.json({ cdKey });
});


app.get("/redeem", async (req, res) => {
   if (!req.session.authenticated) {
     res.redirect("/");
     return;
  }
  res.render("redeem");
  const user = await userCollection.findOne({ username: req.session.username });
  if (!user || user.cdKeys.length === 0) {
    res.status(400).send("No CD keys left");
    return;
  }
  const cdKey = user.cdKeys.pop();
  await userCollection.updateOne({ username: req.session.username }, { $set: { cdKeys: user.cdKeys } });
  res.json({ cdKey });
});



//Warehouse page
// app.get("/warehouse", (req, res) => {
//   if (!req.session.authenticated) {
//     res.redirect("/");
//     return;
//   }
//   res.render("warehouse");
// });

app.get("/warehouse", async (req, res) => {
  if (!req.session.authenticated) {
    res.redirect("/");
    return;
  }
  const user = await userCollection.findOne({ username: req.session.username });
  res.render("warehouse", { title: "Warehouse", redeemedKey: user.redeemedKey || "No key redeemed yet" });
});

//Redeem Page and Functionality
app.get("/redeem", (req, res) => {
  if (!req.session.authenticated) {
    res.redirect("/");
    return;
  }
  res.render("redeem", {title: "Redeem"})
});

app.get("/getRemainingQuantity", (req, res) => {
  if (!req.session.authenticated) {
    res.status(401).send("Unauthorized");
    return;
  }
  res.json({ remainingQuantity: remainingQuantity });
});

app.post("/updateRemainingQuantity", (req, res) => {
  if (!req.session.authenticated) {
    res.status(401).send("Unauthorized");
    return;
  }
  req.session.remainingQuantity -= 1;
  res.json({ remainingQuantity: req.session.remainingQuantity });
});

// app.post("/resetRemainingQuantity", (req, res) => {
//   if (!req.session.authenticated) {
//     res.status(401).send("Unauthorized");
//     return;
//   }
//   remainingQuantity = 10;
//   res.json({ remainingQuantity: remainingQuantity });
// });

// Read and parse cdk.txt
let cdkKeys = fs.readFileSync(path.join(__dirname, 'cdk.txt'), 'utf8').split('\n').filter(key => key);

app.get("/redeemKey", async (req, res) => {
  if (!req.session.authenticated) {
    res.status(401).send("Unauthorized");
    return;
  }

  // Get the user from the database
  const user = await userCollection.findOne({ username: req.session.username });
  
  // If the user has already redeemed a key, return an error
  if (user.redeemedKey) {
    res.status(400).json({ message: "You have already redeemed a key.", cdKey: user.redeemedKey });
    return;
  }

  // If no keys are left, return an error
  if (cdkKeys.length === 0 || remainingQuantity === 0) {
    res.status(400).json({ message: "No keys left to redeem." });
    return;
  }

  // Pick a random key
  const randomIndex = Math.floor(Math.random() * cdkKeys.length);
  const redeemedKey = cdkKeys[randomIndex];
  cdkKeys = cdkKeys.filter((_, index) => index !== randomIndex);

  // Update the user document in the database
  await userCollection.updateOne({ username: req.session.username }, { $set: { redeemedKey } });

  // Write the updated keys from cdk.txt
  fs.writeFileSync(path.join(__dirname, 'cdk.txt'), cdkKeys.join('\n'));

  remainingQuantity -= 1;

  // Respond with the redeemed key
  res.json({ cdKey: redeemedKey, remainingQuantity: remainingQuantity });
});

//Event Page
app.get("/event", (req, res) => {
  if (!req.session.authenticated) {
    res.redirect("/");
    return;
  }
  res.render("event", {title: "Event"})
});

//Setting Page
app.get("/setting", (req, res) => {
  if (!req.session.authenticated) {
    res.redirect("/");
    return;
  }
  res.render("setting", {title: "Setting"})
});

app.get("/index", (req, res) => {
  if (!req.session.authenticated) {
    res.redirect("/login");
    return;
  }

  res.render("index", { username: req.session.username, title: "Home Page" });
});

app.get("/event", (req, res) => {
  if (!req.session.authenticated) {
    res.redirect("/");
    return;
  }
  res.render("event", { title: "Event" });
});

app.get("/profile", (req, res) => {
  if (!req.session.authenticated) {
    res.redirect("/");
    return;
  }
  res.render("profile", {username: "test", email: "test@email.ca", phone: "(111) 111-1111", title: "Profile", image: "/img/steam_logo.png"});
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

    res.redirect("/event");
    return;
  } else {
    console.log("wrong password");
    res.redirect("/login?errorMsg=Invalid email/password combination.");
    return;
  }
  res.render("pricecompare");
});
//sohee parts

// app.get('/games/:gameTemplate', (req, res) => {
//   // req.params.gameTemplate을 사용해서 게임 데이터를 로드하고 렌더링
// });

app.get('/popular', (req, res) => {
  // popular.html 파일을 렌더링할 때 필요한 데이터
  const games = [
    {
      name: 'Minecraft',
      template: 'minecraft',
      image: 'https://upload.wikimedia.org/wikipedia/en/5/51/Minecraft_cover.png',
      genre: 'Open world, Action game, Sandbox',
    },
    {
      name: 'Grand Theft Auto V',
      template: 'gta',
      image: 'https://upload.wikimedia.org/wikipedia/en/a/a5/Grand_Theft_Auto_V.png',
      genre: 'Action-adventure game, Racing video game',
    },
    {
      name: 'Fortnite',
      template: 'fortnite',
      image: 'https://imgix.ranker.com/user_node_img/3837/76737071/original/76737071-photo-u8?auto=format&q=60&fit=fill&fm=pjpg&dpr=2&crop=faces&bg=fff&h=300&w=300',
      genre: 'Survival, battle royale, sandbox',
    },
    {
      name: 'Super Smash Bros. Ultimate',
      template: 'sss',
      image: 'https://imgix.ranker.com/user_node_img/4269/85375035/original/super-smash-bros-ultimate-photo-u2?auto=format&q=60&fit=fill&fm=pjpg&dpr=2&crop=faces&bg=fff&h=300&w=300',
      genre: 'Fighting',
    },
    {
      name: 'Red Dead Redemption II',
      template: 'reddead',
      image: 'https://upload.wikimedia.org/wikipedia/en/4/44/Red_Dead_Redemption_II.jpg',
      genre: 'Action-adventure',
    },
    {
      name: 'Among Us',
      template: 'amongus',
      image: 'https://imgix.ranker.com/user_node_img/4270/85381195/original/among-us-u1?auto=format&q=60&fit=fill&fm=pjpg&dpr=2&crop=faces&bg=fff&h=300&w=300',
      genre: 'Party video game, survival video game',
    }
  ];

  res.render('popular', { games, title: 'Popular Games' });

});

app.get('/gamedetail', (req, res) => {
  const gameName = 'Game Name'; // 실제 게임 이름으로 대체해야 합니다.
  const gameRating = 'Game Rating'; // 실제 게임 평점으로 대체해야 합니다.
  const gameDescription = 'Game Description'; // 실제 게임 설명으로 대체해야 합니다.
  const gameImage = 'path/to/game/image.jpg'; // 실제 게임 이미지 경로로 대체해야 합니다.
  const similarGames = ['Similar Game 1', 'Similar Game 2']; // 실제 유사한 게임 목록으로 대체해야 합니다.

  // res.render('gamedetail', { gameName, gameRating, gameDescription, gameImage, similarGames, title: 'Game Detail' });
  res.render('gamedetail', { gameName: 'Example Game', gameRating: 8.5, gameDescription: 'This is an example game.', gameImage: '/images/example.jpg', similarGames: ['Game A', 'Game B', 'Game C'], title: 'Game Detail' });


});

app.get('/profile', async (req, res) => {
  try {
    const user = await database.db('COMP2800-BBY-12').collection('users').findOne({ username: req.session.username });

    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    }

    const { username, email, phone, image } = user; // 필요한 사용자 정보 추출

    res.render('profile', { username, email, phone, image, title: 'Profile' });

  } catch (error) {
    console.error('사용자 조회 오류:', error);
    res.status(500).json({ error: '사용자 조회에 실패했습니다' });
  }
});

const dbName = 'COMP2800-BBY-12';

// GET 요청을 처리하는 라우트 핸들러
app.get('/changePasswordForm', (req, res) => {
  res.render('changePassword');  // Render the 'changePassword' view
});

// POST 요청을 처리하는 라우트 핸들러
app.post('/changePassword', async (req, res) => {
  try {
    const username = req.session.username;
    const newPassword = req.body.newPassword;

    const user = await database.db(dbName).collection('users').findOne({ username });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await database.db(dbName).collection('users').updateOne(
      { username },
      { $set: { password: hashedPassword } }
    );

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ error: 'Failed to update password. Try again.' });
  }
});

/// MongoDB connection URL
const url = `mongodb+srv://${mongodb_user}:${mongodb_password}@${mongodb_host}/${mongodb_database}?retryWrites=true&w=majority`;

// Connection options
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

// Create a new MongoClient
const client = new MongoClient(url, options);

// multer 설정
app.post('/upload', upload.single('file'), (req, res, next) => {
  // req.file is the 'file' file
  // req.body will hold the text fields, if there were any
  try {
    console.log(req.file);
    res.send('File uploaded successfully.');
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred while uploading the file.');
  }
});

const image = "/path/to/image.jpg"; // 이미지 파일의 경로
const timestamp = Date.now(); // 현재 시간을 사용하여 타임스탬프 생성

const imageUrl = `${image}?t=${timestamp}`;

// save a picture. now just have binary type.
const validImageExtensions = ['.jpg', '.jpeg', '.png', '.gif'];

app.post('/submitProfile', upload.single('profileImage'), async (req, res) => {
  try {
    if (req.file) {
      // Handle the uploaded image file
      console.log('Profile image uploaded:', req.file.filename);

      // Update the user's profile image path in the database
      const username = req.session.username; // Replace with your own user identifier
      const imagePath = `/uploads/${req.file.filename}`;

      await userCollection.updateOne(
        { username: username },
        { $set: { image: imagePath } }
      );

      console.log('Profile image path updated in the database');

      // Send a response indicating success and the updated image path
      res.send(imagePath);
    } else {
      res.status(400).send('No file uploaded');
    }
  } catch (error) {
    console.error('Error handling profile image upload:', error);
    res.status(500).send('Error handling profile image upload');
  }
});

app.get('/profile', async (req, res) => {
  const username = req.session.username;

  try {
    // Find the user in the database
    const user = await userCollection.findOne({ username: username });
    if (!user) {
      res.status(404).send('User not found');
      return;
    }

    // Render the profile page with the current profile image
    res.render('profile', { image: user.image, title: 'Profile' })

  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).send("Error fetching user profile");
  }
});

app.get('/recommend', (req, res) => {
  try {
    // 게임 추천에 필요한 데이터를 가져오는 로직
    const imageUrl1 = '/img/reco1.png'; // 첫 번째 추천 이미지 경로
    const imageUrl2 = '/img/reco2.png'; // 두 번째 추천 이미지 경로

    // header와 footer를 포함하여 recommend.ejs 파일을 렌더링
    res.render('recommend', { imageUrl1, imageUrl2, title: 'Recommend' });
  } catch (error) {
    console.error('Error rendering recommend page:', error);
    res.status(500).send('Error rendering recommend page');
  }
});

app.get("/recommended", (req, res) => {
  if (!req.session.authenticated) {
    res.redirect("/");
    return;
  }
  res.render("recommend", {imageUrl1: "/img/steam_logo.png", imageUrl2: "/img/search_icon.png", title: "Recommended Games"});
});

app.get("/settings", (req, res) => {
  if (!req.session.authenticated) {
    res.redirect("/");
    return;
  }
  res.render("settings", { title: settings });
});

app.get("/notif-settings", (req, res) => {
  if (!req.session.authenticated) {
    res.redirect("/");
    return;
  }
  res.render("notif-settings");
});

app.get("/sec-settings", (req, res) => {
  if (!req.session.authenticated) {
    res.redirect("/");
    return;
  }
  res.render("sec-settings");
});

app.get('/gamedetails', (req, res) => {
  let gameID = req.query.game_ID; // SteamID for the game, allows for the code here to get all of the other details for the game.
  let resultIndex = 0;
  if (!req.query.game_ID) {
    gameID = 0;
  }
  for (let i = 0; i < gamesJSONData.length; i++) {
    if (gamesJSONData[i].appid == gameID) {
      resultIndex = i;
    }
  }
  let game = gamesJSONData[resultIndex];
  let exampleID = 1;
  if (resultIndex == 1) {
    exampleID = 3;
  }
  let gameName = game.name; // 실제 게임 이름으로 대체해야 합니다.
  let gameRating = Math.round((game.positive / (game.positive + game.negative)) * 10000) / 100; // 실제 게임 평점으로 대체해야 합니다.
  let gameDescription = game.short_description; // 실제 게임 설명으로 대체해야 합니다.
  let gameImage = game.header_image; // 실제 게임 이미지 경로로 대체해야 합니다.
  let appid = gamesJSONData[exampleID].appid;
  let similarGames = `<a href='/gamedetails?game_ID=${appid}'><img id='${appid}' class='moregame' onmouseleave='closeHoverMenu(${appid})' onmouseenter='openHoverMenu(${appid})' src='${gamesJSONData[exampleID].header_image}'></a>`; // 실제 유사한 게임 목록으로 대체해야 합니다.

  res.render('gamedetail', {
    gameName: gameName, gameRating: gameRating, gameDescription: gameDescription,
    gameImage: gameImage, similarGames: similarGames, title: `${gameName} Details`,
    truncatedDesc: `${gamesJSONData[exampleID].short_description.substring(0, 200)}...`,
    moreGameName: `${gamesJSONData[exampleID].name}`
  });


});

app.get("/searchresults", (req, res) => {
  let search = req.query.search;
  let capitalised = search.substring(0, 1).toUpperCase() + search.substring(1, search.length);
  let allcaps = search.toUpperCase();
  let result = -1;
  let searchResult = "";
  if ("Counter-Strike".includes("Counter")) {
    console.log("Counter will return the game Counter Strike.");
  } else {
    console.log("Counter will not return the game Counter Strike");
  }
  if (search.length == 1) {
    capitalised = search.toUpperCase();
  }
  for (i = 0; i < gamesJSONData.length; i++) {
    if (gamesJSONData[i].name.includes(search) || gamesJSONData[i].name.includes(capitalised) || gamesJSONData[i].name.includes(allcaps)) {
      result = i;
      let storeLink = gamesJSONData[result].name.replace(" ", "_");
      let total = gamesJSONData[result].positive + gamesJSONData[result].negative;
      console.log(`localhost:3200/gamedetails?game_name=${gamesJSONData[result].name}&ratings=${(gamesJSONData[result].positive / total) * 100}&imageurl=${gamesJSONData[result].header_image}&desc='${gamesJSONData[result].short_description.replace("'", "%27")}'`);
      searchResult += `
      <div class='card'>
        <p class='game-title'>${gamesJSONData[result].name}</p>
        <img class='game-img' src=${gamesJSONData[result].header_image}>
        <span class='desc'>${gamesJSONData[result].short_description}</span>
        <p class='overall-rating'>${Math.round(((gamesJSONData[result].positive / total) * 100) * 100) / 100}% Positive Reviews</p>
        <div class='links'>
          <a href='https://store.steampowered.com/app/${gamesJSONData[result].appid}/${storeLink}' target=_blank>Store Page</a>
          <br>
          <a class='btn btn-primary detail-button' href='/gamedetails?game_ID=${gamesJSONData[result].appid}'>More Details</a>
        </div>
      </div>
      `;
    }
  }
  if (result <= -1) {
    result = 0;
  }
  if (!req.session.authenticated) {
    res.redirect("login");
    return;
  }
  res.render("searchresults", { title: "Search Results", search_query: search, search_results: searchResult });
});

// Will need to be connected to actual log out functions.
app.get("/logout", (req, res) => {
  if (!req.session.authenticated) {
    res.redirect("/");
    return;
  }
  res.render("logout");
});

app.get("/csvexample", (req, res) => {
  let input = "Test";
  let result = input;
  res.render("csvexample", { search_query: result, title: "Test" });
});

app.get('/free', (req, res) => {
  try {
    // 게임 목록 데이터를 가져오는 로직
    const games = [
      {
        name: 'League of Legends',
        template: 'lol',  // 이 게임의 세부 정보를 보여줄 EJS 파일 이름
        image: 'https://wallpaperaccess.com/full/2379009.jpg',
        genre: 'MOBA',
      },
      {
        name: 'Apex Legends',
        template: 'apex',
        image: 'https://mms.businesswire.com/media/20190204005535/en/703803/4/APEX_Primary_Art_72dpi_RGB_FIN.jpg',
        genre: 'battle royale',
      },
      {
        name: 'Warframe',
        template: 'warframe',
        image: 'https://s.yimg.com/fz/api/res/1.2/TBGlJPuGrYCI.pz5Vt1JBA--~C/YXBwaWQ9c3JjaGRkO2ZpPWZpdDtoPTI2MDtxPTgwO3c9MjYw/https://s.yimg.com/zb/imgv1/30fe762d-df30-303f-aa96-d81d6621bdac/t_500x300',
        genre: 'Online action',
      },
      {
        name: 'Fortnite',
        template: 'fortnite',
        image: 'https://imgix.ranker.com/user_node_img/3837/76737071/original/76737071-photo-u8?auto=format&q=60&fit=fill&fm=pjpg&dpr=2&crop=faces&bg=fff&h=300&w=300',
        genre: 'Survival, battle royale, sandbox',
      },
      {
        name: 'Genshin Impact',
        template: 'gensin',
        image: 'https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/a98cff5d-a612-49d8-a0db-175994384b20/de6gwbc-c62515e8-9411-41f1-a478-41972654fd0b.png/v1/fill/w_512,h_512,strp/genshin_impact_icon_by_kiramaru_kun_de6gwbc-fullview.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9NTEyIiwicGF0aCI6IlwvZlwvYTk4Y2ZmNWQtYTYxMi00OWQ4LWEwZGItMTc1OTk0Mzg0YjIwXC9kZTZnd2JjLWM2MjUxNWU4LTk0MTEtNDFmMS1hNDc4LTQxOTcyNjU0ZmQwYi5wbmciLCJ3aWR0aCI6Ijw9NTEyIn1dXSwiYXVkIjpbInVybjpzZXJ2aWNlOmltYWdlLm9wZXJhdGlvbnMiXX0.aAlCN4I4hmNlQLEkdBgimNt61LuwE2URyQkrREEtPCc',
        genre: 'Open-world adventure',
      },
      {
        name: 'Call of Duty Warzone',
        template: 'callof',
        image: 'https://tse3.mm.bing.net/th?id=OIP.NSNSp4aTWGfwM_gs5uBwDwHaHa&pid=Api&P=0',
        genre: 'Battle royale',
      }
    ];

    // free.ejs 파일을 렌더링하고 게임 목록 데이터를 전달
    res.render('free', { games, title: 'Free Games' });

  } catch (error) {
    console.error('Error rendering free page:', error);
    res.status(500).send('Error rendering free page');
  }
});

app.get('/games/sss', (req, res) => {
  const gameName = 'Super Smash Bros. Ultimate';
  const gameRating = '96% of users like this video game';
  const gameDescription = 'Super Smash Bros. Ultimate is a crossover fighting game developed by Bandai Namco Studios and Sora Ltd. and published by Nintendo. It is the fifth installment in the Super Smash Bros. series. The game features a diverse roster of characters from various video game franchises, including Mario, Link, Pikachu, Sonic, and many more. Players can engage in fast-paced and chaotic multiplayer battles, where the objective is to knock opponents off the stage. Super Smash Bros. Ultimate offers a wide range of game modes, including a single-player campaign, online multiplayer, and local multiplayer with friends. With its extensive character roster, vibrant visuals, and addictive gameplay, Super Smash Bros. Ultimate has become a beloved title among Nintendo and fighting game fans alike.';
  const gameImage = '/img/super.jpg';
  const similarGames = [
    {
      name: 'Brawlhalla',
      image: '/img/halla.jpg'
    },
    {
      name: 'Rivals of Aether',
      image: '/img/aether.jpg'
    },
    {
      name: 'PlayStation All-Stars Battle Royale',
      image: '/img/allstar.jpg'
    }
  ];

  res.render('sss', { gameName, gameRating, gameDescription, gameImage, similarGames, title: 'Among Us' });
});

app.get('/games/reddead', (req, res) => {
  const gameName = 'Red Dead Redemption II';
  const gameRating = '85% of users like this video game';
  const gameDescription = 'Among Us is a popular online multiplayer game developed by InnerSloth. In the game, players work together to complete tasks on a spaceship or space station, while trying to identify and eliminate the impostors among them. It requires strategic thinking, teamwork, and deception skills to succeed. The game has gained immense popularity for its simple yet engaging gameplay, leading to thrilling and suspenseful moments as players try to uncover the impostors and survive.';
  const gameImage = '/img/reddead.jpg';
  const similarGames = [
    {
      name: 'Project Winter: Project Winter',
      image: '/img/winter.jpg'
    },
    {
      name: 'Town of Salem',
      image: '/img/town.jpg'
    },
    {
      name: 'Deceit',
      image: '/img/deceit.jpg'
    }
  ];

  res.render('reddead', { gameName, gameRating, gameDescription, gameImage, similarGames, title: 'Among Us' });
});

app.get('/games/gta', (req, res) => {
  const gameName = 'Grand Theft Auto V';
  const gameRating = '97% of users like this video game';
  const gameDescription = 'Grand Theft Auto V, also known as GTA V, is an action-adventure game developed by Rockstar North. Set in the fictional city of Los Santos, the game follows the lives of three main protagonists: Michael, Franklin, and Trevor, as they navigate through a sprawling open-world environment. Players can engage in various missions and activities, including heists, car races, and random encounters, allowing for a diverse and immersive gameplay experience. With its stunning graphics, detailed world design, and compelling storyline, GTA V has garnered critical acclaim and has become one of the best-selling video games of all time. The game offers both a single-player campaign and an online multiplayer mode, providing endless opportunities for exploration, interaction, and mayhem in the vast city of Los Santos.';
  const gameImage = '/img/gta.jpg';
  const similarGames = [
    {
      name: 'Dead Redemption 2',
      image: '/img/reddead1.jpg'
    },
    {
      name: 'Saints Row IV',
      image: '/img/saints.jpg'
    },
    {
      name: 'Sleeping Dogs',
      image: '/img/sleep.jpg'
    }
  ];

  res.render('gta', { gameName, gameRating, gameDescription, gameImage, similarGames, title: 'Among Us' });
});

app.get('/games/callof', (req, res) => {
  const gameName = 'Call of Duty Warzone';
  const gameRating = '79% of users like this video game';
  const gameDescription = 'Call of Duty Warzone is a free-to-play battle royale game developed by Infinity Ward and Raven Software. It is part of the popular Call of Duty franchise and offers a large-scale, immersive multiplayer experience. In Warzone, players are dropped into a massive map where they fight against other players to be the last one standing. The game combines elements of traditional Call of Duty gameplay with the battle royale genre, offering intense gunfights, strategic gameplay, and a wide range of weapons and equipment to use. With its realistic graphics, intense action, and seamless integration with the Call of Duty universe, Warzone has garnered a dedicated player base and continues to be a popular choice for battle royale enthusiasts.';
  const gameImage = '/img/callof1.jpg';
  const similarGames = [
    {
      name: 'Apex Legends',
      image: '/img/apex3.jpg'
    },
    {
      name: 'PUBG',
      image: '/img/pubg2.png'
    },
    {
      name: 'Call of Duty: Warzone',
      image: '/img/warzone1.jpg'
    }
  ];

  res.render('callof', { gameName, gameRating, gameDescription, gameImage, similarGames, title: 'Among Us' });
});

app.get('/games/apex', (req, res) => {
  const gameName = 'Apex Legends';
  const gameRating = '88% of users like this video game';
  const gameDescription = 'Apex Legends is a free-to-play battle royale game developed by Respawn Entertainment. It takes place in the Titanfall universe and features intense first-person shooter gameplay with a focus on team-based combat. Players form squads and compete against other teams in a map filled with weapons, abilities, and unique characters known as "Legends." With its fast-paced action, strategic gameplay, and unique character abilities, Apex Legends has become a popular choice for fans of the battle royale genre.';
  const gameImage = '/img/apex2.jpg';
  const similarGames = [
    {
      name: 'Call of Duty: Warzone',
      image: '/img/callof.jpg'
    },
    {
      name: 'Overwatch',
      image: '/img/over.jpg'
    },
    {
      name: 'Fortnite',
      image: '/img/for.jpg'
    }
  ];

  res.render('apex', { gameName, gameRating, gameDescription, gameImage, similarGames, title: 'Among Us' });
});

app.get('/games/fortnite', (req, res) => {
  const gameName = 'Fortnite';
  const gameRating = '85% of users like this video game';
  const gameDescription = 'Fortnite is a highly popular battle royale game developed by Epic Games. It features fast-paced gameplay, unique building mechanics, and vibrant visuals. In Fortnite, players are dropped onto an island where they must fight against other players to be the last one standing. The game offers a wide variety of weapons, items, and cosmetic skins that players can collect and use to customize their characters. With its ever-evolving map, frequent updates, and exciting limited-time events, Fortnite has become a cultural phenomenon and has amassed a large and dedicated player base worldwide.';
  const gameImage = '/img/among.jpg';
  const similarGames = [
    {
      name: 'Apex Legends',
      image: '/img/apex1.jpg'
    },
    {
      name: 'PUBG',
      image: '/img/pubg1.jpg'
    },
    {
      name: 'Call of Duty: Warzone',
      image: '/img/warzone1.jpg'
    }
  ];

  res.render('fortnite', { gameName, gameRating, gameDescription, gameImage, similarGames, title: 'Among Us' });
});

app.get('/games/amongus', (req, res) => {
  const gameName = 'Among Us';
  const gameRating = '85% of users like this video game';
  const gameDescription = 'Among Us is a popular online multiplayer game developed by InnerSloth. In the game, players work together to complete tasks on a spaceship or space station, while trying to identify and eliminate the impostors among them. It requires strategic thinking, teamwork, and deception skills to succeed. The game has gained immense popularity for its simple yet engaging gameplay, leading to thrilling and suspenseful moments as players try to uncover the impostors and survive.';
  const gameImage = '/img/among.jpg';
  const similarGames = [
    {
      name: 'Project Winter: Project Winter',
      image: '/img/winter.jpg'
    },
    {
      name: 'Town of Salem',
      image: '/img/town.jpg'
    },
    {
      name: 'Deceit',
      image: '/img/deceit.jpg'
    }
  ];

  res.render('amongus', { gameName, gameRating, gameDescription, gameImage, similarGames, title: 'Among Us' });
});

app.get('/games/gensin', (req, res) => {
  const gameName = 'Genshin Impact';
  const gameRating = '85% of users like this video game';
  const gameDescription = 'Genshin Impact is an open-world action role-playing game developed by miHoYo. Set in the fantasy world of Teyvat, players embark on an epic adventure as the Traveler, exploring diverse regions, uncovering secrets, and battling formidable enemies. With its stunning visuals, immersive world, and engaging gameplay mechanics, Genshin Impact offers a captivating experience for players. The game features a unique elemental system, allowing players to harness the powers of different elements and strategically utilize them in combat. Along the way, players can encounter and recruit a wide range of colorful characters, each with their own abilities and personalities. Genshin Impact has received acclaim for its vast world, compelling story, and frequent content updates, making it a popular choice among RPG enthusiasts.';
  const gameImage = '/img/gen.jpg';
  const similarGames = [
    {
      name: 'Honkai Impact 3rd',
      image: '/img/honkai.jpg'
    },
    {
      name: 'The Legend of Zelda: Breath of the Wild',
      image: '/img/zelda.jpg'
    },
    {
      name: 'Blue Protocol',
      image: '/img/blue.jpg'
    }
  ];

  res.render('gensin', { gameName, gameRating, gameDescription, gameImage, similarGames, title: 'Among Us' });
});

app.get('/games/warframe', (req, res) => {
  const gameName = 'Warframe';
  const gameRating = '95% of users like this video game';
  const gameDescription = 'Warframe is a free-to-play online action role-playing game developed and published by Digital Extremes. In the game, players control members of the Tenno, a race of ancient warriors who have awoken from centuries of cryosleep to find themselves at war with different factions. Players can customize and upgrade their Warframes, which are powerful exoskeletons that grant unique abilities and combat skills. With a focus on cooperative gameplay, Warframe allows players to team up with others to complete missions, explore the vast open-world environments, and take on challenging boss battles. The game features a deep and evolving storyline, a wide variety of weapons and equipment to acquire, and regular content updates to keep players engaged. Warframe offers a fast-paced and dynamic gameplay experience, combining elements of shooting, melee combat, and acrobatic maneuvers. It has garnered a dedicated fanbase and continues to receive positive reviews for its engaging gameplay and ongoing support from the developers.';
  const gameImage = '/img/warframe3.png';
  const similarGames = [
    {
      name: 'Destiny 2',
      image: '/img/destiny.jpg'
    },
    {
      name: 'Warhammer 40,000: Inquisitor - Martyr',
      image: '/img/warhammer.jpg'
    },
    {
      name: 'Path of Exile',
      image: '/img/exile1.jpg'
    }
  ];

  res.render('warframe', { gameName, gameRating, gameDescription, gameImage, similarGames, title: 'Among Us' });
});

app.get('/games/lol', (req, res) => {
  const gameName = 'League of Legends';
  const gameRating = '76% of users like this video game';
  const gameDescription = 'League of Legends, also known as LoL, is a multiplayer online battle arena (MOBA) game developed and published by Riot Games. In League of Legends, players assume the role of a "champion" and compete in teams to destroy the opposing teams nexus, which is the core structure of their base. The game features a diverse roster of champions, each with unique abilities and playstyles, offering a wide range of strategic options and team compositions. Matches in League of Legends are fast-paced and require teamwork, communication, and strategic decision-making to secure victory. With its competitive esports scene and large player base, League of Legends has become one of the most popular and influential games in the industry, attracting millions of players from around the world.';
  const gameImage = '/img/lol1.jpg';
  const similarGames = [
    {
      name: 'Dota 2',
      image: '/img/dota2.jpg'
    },
    {
      name: 'Heroes of the Storm',
      image: '/img/heros.jpg'
    },
    {
      name: 'Smite',
      image: '/img/sm.jpg'
    }
  ];

  res.render('lol', { gameName, gameRating, gameDescription, gameImage, similarGames, title: 'Among Us' });
});

app.get('/games/minecraft', (req, res) => {
  const gameName = 'Minecraft';
  const gameRating = '93% of users like this video game';
  const gameDescription = 'Minecraft is a sandbox video game developed by Mojang Studios. It allows players to explore and create their own virtual worlds made up of blocks. In Minecraft, players can gather resources, build structures, craft items, and engage in various activities such as farming, mining, and fighting off enemies. The game offers multiple game modes, including survival mode where players must manage their resources and survive against threats, creative mode where players have unlimited resources to build and create freely, and adventure mode where players can experience custom-made maps and challenges. Minecraft has a vibrant community and supports multiplayer gameplay, allowing players to collaborate and interact with others in their virtual worlds. With its endless possibilities and open-ended gameplay, Minecraft has become a beloved and iconic game enjoyed by players of all ages.';
  const gameImage = '/img/mine.jpg';
  const similarGames = [
    {
      name: 'Terraria',
      image: '/img/terria.jpg'
    },
    {
      name: 'Roblox',
      image: '/img/roblox.jpg'
    },
    {
      name: 'Stardew Valley',
      image: '/img/valley.png'
    }
  ];

  res.render('minecraft', { gameName, gameRating, gameDescription, gameImage, similarGames, title: 'Among Us' });
});

app.listen(port, () => {
  console.log("Node application listening on port " + port);
});
