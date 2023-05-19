require("./utils.js");

require("dotenv").config();
const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const bcrypt = require("bcrypt");
const saltRounds = 16;
var gamesJSONData;


const port = process.env.PORT || 3200;

const app = express();

const Joi = require("joi");
const { TextEncoder } = require("util");

// Configuring the view engine for an Express.js application to be EJS
app.set('view engine', 'ejs');
app.use(express.static("public"));

const expireTime = 24 * 60 * 60 * 1000; //expires after 1 day  (hours * minutes * seconds * millis)

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
  res.redirect("/");
});

app.get("/redeem", (req, res) => {
  if (!req.session.authenticated) {
    res.redirect("/");
    return;
  }
  res.render("redeem");
});

app.get("/warehouse", (req, res) => {
  // if (!req.session.authenticated) {
  //   res.redirect("/");
  //   return;
  // }
  res.render("warehouse");
});
app.get("/getRemainingQuantity", (req, res) => {
  if (!req.session.authenticated) {
    res.status(401).send("Unauthorized");
    return;
  }
  res.json({ remainingQuantity: req.session.remainingQuantity });
});

app.post("/updateRemainingQuantity", (req, res) => {
  if (!req.session.authenticated) {
    res.status(401).send("Unauthorized");
    return;
  }
  req.session.remainingQuantity -= 1;
  res.json({ remainingQuantity: req.session.remainingQuantity });
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
  res.render("profile", { nickname: "test", email: "test@email.ca" });
});

app.get("/pricecompare", (req, res) => {
  if (!req.session.authenticated) {
    res.redirect("/");
    return;
  }
  res.render("pricecompare");
});

app.get("/recommended", (req, res) => {
  if (!req.session.authenticated) {
    res.redirect("/");
    return;
  }
  res.render("recommend", { imageUrl1: "/img/steam_logo.png", imageUrl2: "/img/search.png" });
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
  let gameName = game.name; // 실제 게임 이름으로 대체해야 합니다.
  let gameRating = Math.round((game.positive / (game.positive + game.negative)) * 10000) / 100; // 실제 게임 평점으로 대체해야 합니다.
  let gameDescription = game.short_description; // 실제 게임 설명으로 대체해야 합니다.
  let gameImage = game.header_image; // 실제 게임 이미지 경로로 대체해야 합니다.
  let similarGames = `<a href='/gamedetails?game_ID=${gamesJSONData[1].appid}'><img id='${gamesJSONData[1].appid}' class='moregame' onmouseleave='closeHoverMenu()' onmouseenter='openHoverMenu(${gamesJSONData[1].appid})' src='${gamesJSONData[1].header_image}'></a>`; // 실제 유사한 게임 목록으로 대체해야 합니다.

  res.render('gamedetail', {
    gameName: gameName, gameRating: gameRating, gameDescription: gameDescription,
    gameImage: gameImage, similarGames: similarGames, title: `${gameName} Details`,
    truncatedDesc: `${gamesJSONData[1].short_description.substring(0, 200)}...`,
    moreGameName: `${gamesJSONData[1].name}`
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

app.listen(port, () => {
  console.log("Node application listening on port " + port);
});
