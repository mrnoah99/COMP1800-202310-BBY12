require("./utils.js");

require("dotenv").config();
const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const MongoClient = require('mongodb').MongoClient;
const formidable = require('formidable');
const multer = require('multer');
const ObjectId = require('mongodb').ObjectId;
const path = require("path");
const mime = require('mime');

const upload = multer({ dest: 'public/uploads/' });





const bcrypt = require("bcrypt");
const saltRounds = 12;

const port = process.env.PORT || 3200;
const app = express();

const Joi = require("joi");

//configuring the view engine for an Express.js application to be EJS
app.set('view engine', 'ejs');
app.use(express.static("public"));


const expireTime = 1 * 60 * 60 * 1000; //expires after 1 hour  (hours * minutes * seconds * millis)

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
  res.redirect("/index");
});


app.get("/redeem", (req, res) => {
  // if (!req.session.authenticated) {
  //   res.redirect("/");
  //   return;
  // }
  res.render("redeem");
});

app.get("/setting", (req, res) => {
  if (!req.session.authenticated) {
    res.redirect("/");
    return;
  }
  res.render("setting");
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
    res.redirect("/");
    return;
  }

  res.render("index", { username: req.session.username });
});

app.get("/event", (req, res) => {
  if (!req.session.authenticated) {
    res.redirect("/");
    return;
  }
  res.render("event");
});

app.get("/login", (req, res) => {
  const errorMsg = req.query.errorMsg;
  res.render("login", { errorMsg });
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

    res.redirect("/index");
    return;
  } else {
    console.log("wrong password");
    res.redirect("/login?errorMsg=Invalid email/password combination.");
    return;
  }
});
//sohee parts
app.get('/popular', (req, res) => {
  // popular.html 파일을 렌더링할 때 필요한 데이터
  const games = [
    {
      name: 'Minecraft',
      image: 'https://upload.wikimedia.org/wikipedia/en/5/51/Minecraft_cover.png',
      genre: 'Open world, Action game, Sandbox',
    },
    {
      name: 'Grand Theft Auto V',
      image: 'https://upload.wikimedia.org/wikipedia/en/a/a5/Grand_Theft_Auto_V.png',
      genre: 'Action-adventure game, Racing video game',
    },
    {
      name: 'Fortnite',
      image: 'https://imgix.ranker.com/user_node_img/3837/76737071/original/76737071-photo-u8?auto=format&q=60&fit=fill&fm=pjpg&dpr=2&crop=faces&bg=fff&h=300&w=300',
      genre: 'Survival, battle royale, sandbox',
    },
    {
      name: 'Super Smash Bros. Ultimate',
      image: 'https://imgix.ranker.com/user_node_img/4269/85375035/original/super-smash-bros-ultimate-photo-u2?auto=format&q=60&fit=fill&fm=pjpg&dpr=2&crop=faces&bg=fff&h=300&w=300',
      genre: 'Fighting',
    },
    {
      name: 'Red Dead Redemption II',
      image: 'https://upload.wikimedia.org/wikipedia/en/4/44/Red_Dead_Redemption_II.jpg',
      genre: 'Action-adventure',
    },
    {
      name: 'Among Us',
      image: 'https://imgix.ranker.com/user_node_img/4270/85381195/original/among-us-u1?auto=format&q=60&fit=fill&fm=pjpg&dpr=2&crop=faces&bg=fff&h=300&w=300',
      genre: 'Party video game, survival video game',
    }
  ];

  res.render('popular.ejs', { games }); // popular.ejs 파일을 렌더링하며 games 데이터를 전달
});


app.get('/gamedetail', (req, res) => {
  const gameName = 'Game Name'; // 실제 게임 이름으로 대체해야 합니다.
  const gameRating = 'Game Rating'; // 실제 게임 평점으로 대체해야 합니다.
  const gameDescription = 'Game Description'; // 실제 게임 설명으로 대체해야 합니다.
  const gameImage = 'path/to/game/image.jpg'; // 실제 게임 이미지 경로로 대체해야 합니다.
  const similarGames = ['Similar Game 1', 'Similar Game 2']; // 실제 유사한 게임 목록으로 대체해야 합니다.

  res.render('gamedetail.ejs', { gameName, gameRating, gameDescription, gameImage, similarGames });
});

app.get('/profile', async (req, res) => {
  try {
    const user = await database.db('COMP2800-BBY-12').collection('users').findOne({ username: req.session.username });

    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    }

    const { username, email, phone, image } = user; // 필요한 사용자 정보 추출

    res.render('profile', { username, email, phone, image });
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

// app.post('/submitProfile', upload.single('profileImage'), async (req, res) => {
//   try {
//     if (req.file) {
//       // Handle the uploaded image file
//       // Update the profile image path or perform any other necessary operations
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


// app.get('/profile', async (req, res) => {
//   const username = req.session.username;

//   try {
//     // Find the user in the database
//     const user = await userCollection.findOne({ username: username });
//     if (!user) {
//       res.status(404).send('User not found');
//       return;
//     }

//     // Render the profile page with the current profile image
//     res.render('profile', { image: user.image });
//   } catch (error) {
//     console.error("Error fetching user profile:", error);
//     res.status(500).send("Error fetching user profile");
//   }
// });

// app.post("/submitProfile", upload.single("profileImage"), async (req, res) => {
//   try {
//     if (req.file) {
//       // Handle the uploaded image file
//       // Update the profile image path or perform any other necessary operations
//       console.log("Profile image uploaded:", req.file.filename);

//       // Update the user's profile image path in the database
//       const username = req.session.username; // Replace with your own user identifier
//       const imagePath = `/uploads/${req.file.filename}`;

//       await userCollection.updateOne(
//         { username: username },
//         { $set: { image: imagePath } }
//       );

//       console.log("Profile image path updated in the database");

//       // Send a response indicating success and the updated image path
//       res.send(imagePath);
//     } else {
//       res.status(400).send("No file uploaded");
//     }
//   } catch (error) {
//     console.error("Error handling profile image upload:", error);
//     res.status(500).send("Error handling profile image upload");
//   }
// });

// // index.js
// app.get('/profile', async (req, res) => {
//   const username = req.session.username;

//   try {
//     // Find the user in the database
//     const user = await userCollection.findOne({ username: username });
//     if (!user) {
//       res.status(404).send('User not found');
//       return;
//     }

//     const timestamp = Date.now(); // 타임스탬프 변수 추가

//     // Render the profile page with the current profile image and timestamp
//     res.render('profile', { image: user.image, timestamp }); // timestamp 변수 전달
//   } catch (error) {
//     console.error("Error fetching user profile:", error);
//     res.status(500).send("Error fetching user profile");
//   }
// });


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
    res.render('profile', { image: user.image });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).send("Error fetching user profile");
  }
});













app.listen(port, () => {
  console.log("Node application listening on port " + port);
});

