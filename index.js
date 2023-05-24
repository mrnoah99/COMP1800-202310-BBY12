require("./utils.js");

require("dotenv").config();
const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const bcrypt = require("bcrypt");
const saltRounds = 12;
const fs = require('fs');
const path = require("path");

const port = process.env.PORT || 8000;

const app = express();

const Joi = require("joi");

// Configuring the view engine for an Express.js application to be EJS
app.set('view engine', 'ejs');
app.use(express.static("public"));
// const MongoClient = require('mongodb').MongoClient;
// const formidable = require('formidable');
// const multer = require('multer');

// const mime = require('mime');
var { database } = include("databaseConnection");
// const mongoose = require("mongoose");
// const ObjectID = mongoose.Types.ObjectId;

// const upload = multer({ dest: 'public/uploads/' });

// var gamesJSONData;

// const { TextEncoder } = require("util");
const expireTime = 24 * 60 * 60 * 1000;

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


// Gets the 55,000 games dataset loaded into a variable accessible by the rest of index.js
// const fs = require("fs");
// fs.readFile("public/datasets/steam_games_test.json", 'UTF-8', (err, data) => {
//   if (err) {
//     console.error("Error reading file: ", err);
//     return;
//   }

//   try {
//     gamesJSONData = JSON.parse(data);
//     console.log("All games:\n" + gamesJSONData);
//   } catch (error) {
//     console.error("Error parsing JSON: ", error);
//   }
// });

app.get("/", (req, res) => {
  if (!req.session.authenticated) {
    const errorMsg = req.query.errorMsg;
    console.log(errorMsg)
    res.redirect("/login");
  } else {
    res.render("index", { title: "Home Page" });
  }
});


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////--------->Seung Yeop Part Below<-------//////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

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
//   res.render("pricecompare");
});


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////--------->Seung Yeop Part Above<-------//////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////







/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////-------------->Eddie Part Below<----------------///////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Read and parse cdk.txt
let cdkKeys = fs.readFileSync(path.join(__dirname, 'cdk.txt'), 'utf8').split('\n').filter(key => key);

//Sign Up and Sign Up Submit
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
  res.render("warehouse" ,{ title: "Warehouse", redeemedKey: user.redeemedKey || "No key redeemed yet" });
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
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////-------------->Eddie Part Abover<----------------//////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


app.listen(port, () => {
  console.log("Node application listening on port " + port);
});