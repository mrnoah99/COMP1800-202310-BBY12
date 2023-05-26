// Importing Node modules with require();
require("./utils.js"); // Contains some global variables.
require("dotenv").config(); // Used to access the .env file provided locally and by our hosting service.
const express = require("express"); // Used with other Node modules to run the app. Listens on the port given and loads pages according to what is asked.
const session = require("express-session"); // Contains session information and variables, to be used for authentication etc.
const MongoStore = require("connect-mongo"); // Used to connect to the MongoDB.
const MongoClient = require('mongodb').MongoClient; // Creates a client connected to the MongoDB, so that it can be edited.
const formidable = require('formidable'); // Handles file uploads and sends them to mime and multer for saving.
const multer = require('multer'); // Saves the files given to it to the server where needed.
const mime = require('mime'); // Gets file extensions so we can tell what type of image file is being uploaded.
const path = require("path"); // Used to set a global path variable.
var { database } = require("./databaseConnection"); // Connects index.js functions to the MongoDB.
const mongoose = require("mongoose"); // Used to send/receive data, and convert image files into data.
const fs = require('fs'); // Used for reading txt and json files.
const bcrypt = require("bcrypt"); // Encrypts/hashes passwords when sent to the server.
const Joi = require("joi"); // Used to check usernames/passwords/emails to verify logins.

// Sets a variable for accepting images for pfps, and one for getting IDs from Objects containing image data for the profile page, and data for the community page.
// const upload = multer({ dest: 'public/uploads/' }); // Doesn't work with hosting on cyclic.
const ObjectID = mongoose.Types.ObjectId;

// Number of hashes for the passwords and the port the app runs on.
const saltRounds = 12;
const port = process.env.PORT || 3200;

// The two variables used to store data from the steam game datasets.
var gamesJSONData;
var game1data;
var game2data;

// Variable that acts as the server, taking requests and handling them.
const app = express();

// Configuring the view engine for an Express.js application to be EJS
app.set('view engine', 'ejs');

// Sets a static path for all of index.js to use for finding files.
app.use(express.static("public"));

// Connects the database. Again, because apparently we need two of them.
var { database } = include("databaseConnection");

// Sets the time that a user can remain logged in to 24hrs, which forces them to log back in after this duration.
const expireTime = 24 * 60 * 60 * 1000;

// secret information section
const mongodb_host = process.env.MONGODB_HOST;
const mongodb_user = process.env.MONGODB_USER;
const mongodb_password = process.env.MONGODB_PASSWORD;
const mongodb_database = process.env.MONGODB_DATABASE;
const mongodb_session_secret = process.env.MONGODB_SESSION_SECRET;

const node_session_secret = process.env.NODE_SESSION_SECRET;

// Constants for the user and posts collections in the database, used to track community posts and their content, as well as the users as they log in or sign up.
const userCollection = database.db(mongodb_database).collection("users");
const postCollection = database.db(mongodb_database).collection("posts");

// The url used to link to the MongoDB.
const url = `mongodb+srv://${mongodb_user}:${mongodb_password}@${mongodb_host}/${mongodb_database}?retryWrites=true&w=majority`;

// Tells express to use the MongoDB url.
app.use(express.urlencoded({ extended: false }));

// Variable for storing information to the MongoDB.
var mongoStore = MongoStore.create({

  mongoUrl: `mongodb+srv://${mongodb_user}:${mongodb_password}@${mongodb_host}/${mongodb_database}?retryWrites=true&w=majority`,
  crypto: {
    secret: mongodb_session_secret
  }
})

// Sets variables for the server.
app.use(session({
  secret: node_session_secret, // Secret variable used for hosting the server.
  store: mongoStore, //default is memory store .
  saveUninitialized: false, // Tells Node to disallow saving information when the next page isn't yet initialised?
  resave: true // I actually don't remember what this one does.
}
));

// Gets the 55,000 games dataset loaded into two variables accessible by the rest of index.js
fs.readFile("public/datasets/steam_games-part1.json", 'UTF-8', (err, data) => {
  if (err) {
    console.error("Error reading file: ", err);
    return;
  }

  try {
    game1data = JSON.parse(data);
  } catch (error) {
    console.error("Error parsing JSON: ", error);
  }
});

fs.readFile("public/datasets/steam_games-part2.json", 'UTF-8', (err, data) => {
  if (err) {
    console.error("Error reading file: ", err);
    return;
  }

  try {
    game2data = JSON.parse(data);
  } catch (error) {
    console.error("Error parsing JSON: ", error);
  }
});

// Home page of the app. The login page and some others redirect here when the session is already logged in.
app.get("/", (req, res) => {
  if (!req.session.authenticated) {
    const errorMsg = req.query.errorMsg;
    console.error("Invalid session, please login.", errorMsg);
    res.redirect("/login");
  } else {
    res.render("index", {title: "Home Page", user: req.session.username});
  }
  if (gamesJSONData == null) {
    gamesJSONData = [].concat(Object.values(game1data), Object.values(game2data));
  }
});

// Login page, has inputs for the user to pass in their email and password to log in.
app.get("/login", (req, res) => {
  if (!req.session.authenticated) {
    const errorMsg = req.query.errorMsg;
    res.render("login", { errorMsg });
  } else {
    res.redirect("/");
  }
});

// Processes the login request from the user.
app.post("/loginSubmit", async (req, res) => {

  var email = req.body.email;
  var password = req.body.password;

  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().max(20).required(),
  });

  const validationResult = schema.validate({ email, password });
  if (validationResult.error != null) {
    console.error("Invalid login: Incorrect email/password combination", validationResult.error);
    res.redirect("/login");
    return;
  }

  const result = await userCollection.find({ email: email }).project({ email: 1, password: 1, _id: 1, username: 1 }).toArray();

  if (result.length != 1) {
    console.error("User is not found...");
    res.redirect("/login");
    return;
  }
  if (await bcrypt.compare(password, result[0].password)) {

    req.session.authenticated = true;
    req.session.username = result[0].username;
    req.session.cookie.maxAge = expireTime;

    res.redirect("/");
    return;
  } else {
    console.error("Incorrect password");
    res.redirect("/login?errorMsg=Invalid email/password combination.");
    return;
  }
});

// Community page, contains user posts and the option to create a post.
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
    console.error(err);
    res.send("Error while fetching posts");
  }
  if (gamesJSONData == null) {
    gamesJSONData = [].concat(Object.values(game1data), Object.values(game2data));
  }
});

// Loads a community post from an ID.
app.get("/community/:postId/details", async (req, res) => {
  if (!req.session.authenticated) {
    res.redirect("/login");
  }
  const postId = new ObjectID(req.params.postId);

  try {
    const post = await postCollection.findOne({ _id: postId });
    res.render("post", { post: post, title: "Community" });
  } catch (err) {
    console.error(err);
    res.send("Error while fetching post details");
  }
  if (gamesJSONData == null) {
    gamesJSONData = [].concat(Object.values(game1data), Object.values(game2data));
  }
});

// For posting on the community page.
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
    console.error(err);
    res.send("Error while inserting post");
  }
});

// For posting on the community page.
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

app.get("/community/write", (req, res) => {
  if (!req.session.authenticated) {
    res.redirect("/login");
  }
  res.render("communitywrite",{title: "Community"});
  if (gamesJSONData == null) {
    gamesJSONData = [].concat(Object.values(game1data), Object.values(game2data));
  }
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

// Loads the number of likes for a community post.
app.get("/community/:postId/like", async (req, res) => {
  if (!req.session.authenticated) {
    res.redirect("/login");
  }
  const postId = new ObjectID(req.params.postId);

  try {
    const post = await postCollection.findOne({ _id: postId });
    res.json({ success: true, likes: post.likes.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error while fetching like count" });
  }
  if (gamesJSONData == null) {
    gamesJSONData = [].concat(Object.values(game1data), Object.values(game2data));
  }
});

// Changes the number of likes for a community post.
app.post("/community/:postId/like", async (req, res) => {
  if (!req.session.authenticated) {
    res.redirect("/login");
  }
  const postId = new ObjectID(req.params.postId);
  const userId = req.session.userId;

  try {
    const post = await postCollection.findOne({ _id: postId });

    let index = -1;
    if (post.likes) {
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

// Redirects to '/' if you go here.
app.get("/index", (req, res) => {
  if (!req.session.authenticated) {
    res.redirect("/login");
    return;
  } else {
    res.redirect("/");
    return;
  }
});

// Profile page, where the user can change their password and profile picture.
app.get('/profile', async (req, res) => {
  try {
    const user = await database.db('COMP2800-BBY-12').collection('users').findOne({ username: req.session.username });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const { username, email, phone, image } = user; 

    res.render('profile', { username, email, phone, image, title: 'Profile' });

  } catch (error) {
    console.error("Error looking up user: ", error);
    res.status(500).json({ error: "User lookup failed." });
  }
  if (gamesJSONData == null) {
    gamesJSONData = [].concat(Object.values(game1data), Object.values(game2data));
  }
});

const dbName = 'COMP2800-BBY-12';

// Goes to the page where a user can change their password to restore their account if they forget.
app.get('/changePasswordForm', (req, res) => {
  res.render('changePassword'); 
});

// Changes the password of the user.
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

const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

const client = new MongoClient(url, options);

// For uploading an image for a user profile picture.
// app.post('/upload', upload.single('file'), (req, res, next) => {
//   try {
//     console.log(req.file);
//     res.send('File uploaded successfully.');
//   } catch (error) {
//     console.error(error);
//     res.status(500).send('An error occurred while uploading the file.');
//   }
// });

const image = "/path/to/image.jpg";
const timestamp = Date.now(); 

const imageUrl = `${image}?t=${timestamp}`;

const validImageExtensions = ['.jpg', '.jpeg', '.png', '.gif'];

// Updates the user profile in MongoDB.
// app.post('/submitProfile', upload.single('profileImage'), async (req, res) => {
//   try {
//     if (req.file) {
//       // Handle the uploaded image file
//       console.log('Profile image uploaded:', req.file.filename);

//       // Update the user's profile image path in the database
//       const username = req.session.username; // Replace with your own user identifier
//       const imagePath = `/uploads/${req.file.filename}`;

//       await userCollection.updateOne(
//         { username: username },
//         { $set: { image: imagePath } }
//       );

//       console.log('Profile image path updated in the database');

//       // Send a response indicating success and the updated image path
//       res.send(imagePath);
//     } else {
//       res.status(400).send('No file uploaded');
//     }
//   } catch (error) {
//     console.error('Error handling profile image upload:', error);
//     res.status(500).send('Error handling profile image upload');
//   }
// });

// Notification settings page. Does not currently exist as I ran out of time to make it.
app.get("/notif-settings", (req, res) => {
  if (!req.session.authenticated) {
    res.redirect("/");
    return;
  }
  res.render("notif-settings");
  if (gamesJSONData == null) {
    gamesJSONData = [].concat(Object.values(game1data), Object.values(game2data));
  }
});

// Security settings page. Does not currently exist for the same reason as above.
app.get("/sec-settings", (req, res) => {
  if (!req.session.authenticated) {
    res.redirect("/");
    return;
  }
  res.render("sec-settings");
  if (gamesJSONData == null) {
    gamesJSONData = [].concat(Object.values(game1data), Object.values(game2data));
  }
});

// Details for a game page. Has a hardcoded "more games like it" part but everything else uses the datasets.
app.get('/gamedetails', (req, res) => {
  if (gamesJSONData == null) {
    gamesJSONData = [].concat(Object.values(game1data), Object.values(game2data));
  }
  let gameID = req.query.game_ID; // Gets an ID passed in from the game details links, and uses that to get the information from the datasets.
  let resultIndex = 0;e
  if (!req.query.game_ID) {
    gameID = 0;
  }
  for (let i = 0; i < gamesJSONData.length; i++) {
    if (gamesJSONData[i].appid == gameID) {
      resultIndex = i;
      break;
    }
  }
  let game = gamesJSONData[resultIndex];
  let gameName = game.name;
  let gameRating = Math.round((game.positive / (game.positive + game.negative)) * 10000) / 100;
  let gameDescription = game.short_description;
  let gameImage = game.header_image;
  let months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  let releaseDate = `${game.release_date} (${months[parseInt(game.release_date.substring(5, 7)) - 1]} ${game.release_date.substring(8, game.release_date.length)}, ${game.release_date.substring(0, 4)})`;
  let age = game.required_age;
  let price = `${game.price.substring(0, (game.price.length-2))}.${game.price.substring((game.price.length-2), game.price.length)}`;
  let platforms = "";
  if (game.platforms.windows == true) {
    platforms = 'Windows';
  }
  if (game.platforms.mac == true && game.platforms.windows == true) {
    platforms = 'Windows, Mac';
  } else if (game.platforms.mac == true) {
    platforms = 'Mac'
  }
  if (game.platforms.linux == true && game.platforms.mac == true && game.platforms.windows == true) {
    platforms = 'Windows, Mac, Linux';
  } else if (game.platforms.linux == true && game.platforms.mac == true) {
    platforms = 'Mac, Linux';
  } else if (game.platforms.linux == true && game.platforms.windows == true) {
    platforms = 'Windows, Linux';
  }
  if (game.platforms.linux == false && game.platforms.mac == false && game.platforms.windows == false) {
    platforms = "Nothing, apparently";
  }
  let languages = game.languages;
  let categories = "";
  for (i = 0; i < game.categories.length; i++) {
    categories += `${game.categories[i]}, `;
  }
  let tags = "";
  for (i = 0; i < Object.keys(game.tags).length; i++) {
    tags += `${Object.keys(game.tags)[i]}: ${Object.values(game.tags)[i]}, `;
  }
  let app1 = `<a href='/gamedetails?game_ID=${gamesJSONData[0].appid}'><img class='moregame' onmouseleave='closeHoverMenu(${gamesJSONData[0].appid})' onmouseenter='openHoverMenu(${gamesJSONData[0].appid})' src='${gamesJSONData[0].header_image}'></a><span id='${gamesJSONData[0].appid}' class="popup">${gamesJSONData[0].name}<br><span class="popupDesc">${gamesJSONData[0].short_description.substring(0, 200)}...</span></span>`;
  let app2 = `<a href='/gamedetails?game_ID=${gamesJSONData[1].appid}'><img class='moregame' onmouseleave='closeHoverMenu(${gamesJSONData[1].appid})' onmouseenter='openHoverMenu(${gamesJSONData[1].appid})' src='${gamesJSONData[1].header_image}'></a><span id='${gamesJSONData[1].appid}' class="popup">${gamesJSONData[1].name}<br><span class="popupDesc">${gamesJSONData[1].short_description.substring(0, 200)}...</span></span>`;
  let app3 = `<a href='/gamedetails?game_ID=${gamesJSONData[2].appid}'><img class='moregame' onmouseleave='closeHoverMenu(${gamesJSONData[2].appid})' onmouseenter='openHoverMenu(${gamesJSONData[2].appid})' src='${gamesJSONData[2].header_image}'></a><span id='${gamesJSONData[2].appid}' class="popup">${gamesJSONData[2].name}<br><span class="popupDesc">${gamesJSONData[2].short_description.substring(0, 200)}...</span></span>`;
  let app4 = `<a href='/gamedetails?game_ID=${gamesJSONData[3].appid}'><img class='moregame' onmouseleave='closeHoverMenu(${gamesJSONData[3].appid})' onmouseenter='openHoverMenu(${gamesJSONData[3].appid})' src='${gamesJSONData[3].header_image}'></a><span id='${gamesJSONData[3].appid}' class="popup">${gamesJSONData[3].name}<br><span class="popupDesc">${gamesJSONData[3].short_description.substring(0, 200)}...</span></span>`;
  let similarGames = `${app1}${app2}${app3}${app4}`; // 실제 유사한 게임 목록으로 대체해야 합니다.

  res.render('gamedetail', {
    gameName: gameName, gameRating: gameRating, gameDescription: gameDescription,
    gameImage: gameImage, similarGames: similarGames, title: `${gameName} Details`,
    storeLink: `https://store.steampowered.com/app/${game.appid}/${game.name.replace(" ", "_")}`,
    categories: categories, languages: languages, platforms: platforms, price: price,
    tags: tags, releaseDate: releaseDate, age: age
  });


});

// Search results from the home page. Searches to see if any of the game titles match the search query, and loads them.
app.get("/searchresults", (req, res) => {
  if (gamesJSONData == null) {
    gamesJSONData = [].concat(Object.values(game1data), Object.values(game2data));
  }
  let search = req.query.search;
  let allcaps = search.toUpperCase();
  let result = -1;
  let searchResult = "";
  for (i = 0; i < gamesJSONData.length; i++) {
    if (gamesJSONData[i].name.includes(search) || gamesJSONData[i].name.includes(allcaps)) {
      result = i;
      let storeLink = gamesJSONData[result].name.replace(" ", "_");
      let total = gamesJSONData[result].positive + gamesJSONData[result].negative;
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

// Logs the user out.
app.get("/logout", (req, res) => {
  if (!req.session.authenticated) {
    res.redirect("/");
    return;
  }

  // Destroy the session and redirect the user
  req.session.destroy(err => {
    if(err) {
      console.log(err);
      res.redirect('/error');
    }
    else {
      res.redirect("/");
    }
  });
});

// Just an example to practise with using .csv dataset files. Not used for anything.
app.get("/csvexample", (req, res) => {
  let input = "Test";
  let result = input;
  res.render("csvexample", { search_query: result, title: "Test" });
});

// Recommended/Popular/Free games pages all combined into one.
app.get('/game', (req, res) => {
  if (gamesJSONData == null) {
    gamesJSONData = [].concat(Object.values(game1data), Object.values(game2data));
  }
  fs.readFile(path.join(__dirname, "public/datasets/steam_games-part1.json"), 'UTF-8', (err, data) => {
    if (err) {
      console.error("Error reading file: ", err);
      res.status(500).send("Internal Server Error");
      return;
    }

    try {
      let testData = JSON.parse(data);
      res.render('game', { games: testData, title: 'Game Page' });
    } catch (error) {
      console.error("Error parsing JSON: ", error);
      res.status(500).send("Internal Server Error");
    }
  });
});

// Sets pages for the games page.
app.get('/api/game', (req, res) => {
  if (gamesJSONData == null) {
    gamesJSONData = [].concat(Object.values(game1data), Object.values(game2data));
  }
  fs.readFile(path.join(__dirname, "public/datasets/steam_games-part1.json"), 'UTF-8', (err, data) => {
    

    try {
      let testData = JSON.parse(data);
      let gamesArray = Object.values(testData);
      
      if (req.query.free === 'true') {
        gamesArray = gamesArray.filter(game => game.price === 0 || game.price === "0");
      }

      if (req.query.popular === 'true') {
        gamesArray = gamesArray.sort((a, b) => {
          const maxOwnersA = Math.max(...a.owners.match(/\d+/g).map(Number));
          const maxOwnersB = Math.max(...b.owners.match(/\d+/g).map(Number));
          return maxOwnersB - maxOwnersA;
        });
      }
      if (req.query.sortPrice === 'desc') {
        gamesArray = gamesArray.sort((a, b) => b.price - a.price);
      }
      else if (req.query.sortPrice === 'asc') {
        gamesArray = gamesArray.sort((a, b) => a.price - b.price);
      }
      
      
      let page = req.query.page ? parseInt(req.query.page) : 1;
      let pageSize = req.query.pageSize ? parseInt(req.query.pageSize) : 10;
      let offset = (page - 1) * pageSize;
      let paginatedItems = gamesArray.slice(offset, offset + pageSize);

      res.json({ 
        page: page,
        perPage: pageSize,
        total: gamesArray.length,
        totalPages: Math.ceil(gamesArray.length / pageSize),
        data: paginatedItems
      });
    } catch (error) {
      console.error("Error parsing JSON: ", error);
      res.status(500).send("Internal Server Error");
    }
  });
});

// Read and parse cdk.txt
let cdkKeys = fs.readFileSync(path.join(__dirname, 'cdk.txt'), 'utf8').split('\n').filter(key => key);

// Where the user can sign up and create an account.
app.get("/signup", (req, res) => {
  res.render("signup");
});

let remainingQuantity = 10;

// Sends sign up details to the MongoDB to register the new user, and redirects to the home page.
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
    console.error(validationResult.error);
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
  res.redirect("/");
});

// Gets a random CDKey from cdk.txt to use for the redeem page.
app.post("/getCDKey", async (req, res) => {
  if (!req.session.authenticated) {
    res.status(401).send("Unauthorized");
    return;
  }

  const user = await userCollection.findOne({ username: req.session.username });
  if (!user || user.cdKeys.length === 0) {
    res.status(400).send("No CD keys left");
    return;
  }
  const cdKey = user.cdKeys.pop();
  await userCollection.updateOne({ username: req.session.username }, { $set: { cdKeys: user.cdKeys } });
  res.json({ cdKey });
  if (gamesJSONData == null) {
    gamesJSONData = [].concat(Object.values(game1data), Object.values(game2data));
  }
});

// Warehouse page, which stores all of the CD Keys that the user has redeemed.
app.get("/warehouse", async (req, res) => {
  if (!req.session.authenticated) {
    res.redirect("/");
    return;
  }
  const user = await userCollection.findOne({ username: req.session.username });
  res.render("warehouse" ,{ title: "Warehouse", redeemedKey: user.redeemedKey || "No key redeemed yet" });
  if (gamesJSONData == null) {
    gamesJSONData = [].concat(Object.values(game1data), Object.values(game2data));
  }
});

// Page for redeeming CD Keys, which adds them to both the clipboard and the warehouse page.
app.get("/redeem", (req, res) => {
  if (!req.session.authenticated) {
    res.redirect("/");
    return;
  }
  res.render("redeem", {title: "Redeem"});
  if (gamesJSONData == null) {
    gamesJSONData = [].concat(Object.values(game1data), Object.values(game2data));
  }
});

// Gets the remaining number of CD Keys for a specific game event.
app.get("/getRemainingQuantity", (req, res) => {
  if (!req.session.authenticated) {
    res.status(401).send("Unauthorized");
    return;
  }
  res.json({ remainingQuantity: remainingQuantity });
  if (gamesJSONData == null) {
    gamesJSONData = [].concat(Object.values(game1data), Object.values(game2data));
  }
});

// Updates the remaining number of CD Keys for a specific game event.
app.post("/updateRemainingQuantity", (req, res) => {
  if (!req.session.authenticated) {
    res.status(401).send("Unauthorized");
    return;
  }
  req.session.remainingQuantity -= 1;
  res.json({ remainingQuantity: req.session.remainingQuantity });
  if (gamesJSONData == null) {
    gamesJSONData = [].concat(Object.values(game1data), Object.values(game2data));
  }
});

// Redeems a CD Key for the user, by randomly selecting one from cdk.txt.
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
  if (gamesJSONData == null) {
    gamesJSONData = [].concat(Object.values(game1data), Object.values(game2data));
  }
});

// Events page, which has all events for games that we have.
app.get("/event", (req, res) => {
  if (!req.session.authenticated) {
    res.redirect("/");
    return;
  }
  res.render("event", {title: "Event"});
  if (gamesJSONData == null) {
    gamesJSONData = [].concat(Object.values(game1data), Object.values(game2data));
  }
});

// Settings page, which links to the specific types of settings.
app.get("/settings", (req, res) => {
  if (!req.session.authenticated) {
    res.redirect("/");
    return;
  }
  res.render("setting", {title: "Settings"});
  if (gamesJSONData == null) {
    gamesJSONData = [].concat(Object.values(game1data), Object.values(game2data));
  }
});

// Catches any unknown pages, and redirects to a 404 page.
app.get("*", (req, res) => {
  res.status(404);
  res.render("404");
})

// Starts the server on either the port specified by the hosting service, or on port 3200.
app.listen(port, () => {
  console.log("Node application listening on port " + port);
});
