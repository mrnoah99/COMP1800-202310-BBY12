require("./utils.js");

require("dotenv").config();
const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const bcrypt = require("bcrypt");
const saltRounds = 12;


const port = process.env.PORT || 9000;

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


  app.get('/nosql-injection', async (req,res) => {
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
        const result = await userCollection.find({name: name}).project({username: 1, password: 1, _id: 1}).toArray();
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
  
      console.log(`invalid: ${invalid} - numRows: ${numRows} - user: `,name);
  
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
  

app.listen(port, () => {
  console.log("Node application listening on port " + port);
});





const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});

// set the view engine to ejs
app.set('view engine', 'ejs');

// public directory to serve static files
app.use('/public', express.static('public'));

// route to render game detail page
app.get('/game-detail', (req, res) => {
    res.render('game-detail', { 
        title: "Game Title",
        reviews: "Overall Reviews",
        price: "Price",
        description: "Description",
        gameImageUrl: "https://via.placeholder.com/640x400",
        relatedGameImages: [
            "https://via.placeholder.com/150",
            "https://via.placeholder.com/150",
            "https://via.placeholder.com/150",
            "https://via.placeholder.com/150",
        ]
    });
});


app.get('/profile.html', (req, res) => {
    res.render('profile', {
        nickname: "User Nickname",
        email: "user@email.com",
    });
});


app.get('/free.html', function(req, res) {
  var games = [
    {
      name: 'League of Legends',
      genres: 'MOBA',
      image: '/public/img/lol.jpg',
      url: 'https://example.com/minecraft'
    },
    {
      name: 'Apex Legends',
      genres: 'battle royale',
      image: '/public/img/apex.jpg',
      url: 'https://example.com/gta5'
    },
    {
      name: 'Fortnite',
      genres: 'Survival, battle royale, sandbox',
      image: '/public/img/fortnite.jpeg',
      url: 'https://example.com/minecraft'
    },
    {
      name: 'Warframe',
      genres: 'Online action',
      image: '/public/img/warframe.jpg',
      url: 'https://example.com/gta5'
    },
    {
      name: 'Genshin Impact',
      genres: 'Open-world adventure',
      image: '/public/img/genshin.jpg',
      url: 'https://example.com/minecraft'
    },
    {
      name: 'Call of Duty Warzone',
      genres: 'Battle royale',
      image: '/public/img/warzone.jpg',
      url: 'https://example.com/gta5'
    }
  ]; // define the games array here
  res.render('free', { games: games });
});



app.get('/popular.html', (req, res) => {
    // games 변수가 어디서 오는지에 따라 이 부분은 당신의 코드에 맞게 변경되어야 합니다.
    // 이 예제에서는 단순히 빈 배열을 사용합니다.
    let games = [
        {
            name: 'Minecraft',
            genres: 'Open world, Action game, Sandbox',
            image: 'https://upload.wikimedia.org/wikipedia/en/5/51/Minecraft_cover.png',
            url: 'https://example.com/minecraft'
          },
          {
            name: 'Grand Theft Auto V',
            genres: 'Action-adventure game, Racing video game',
            image: 'https://upload.wikimedia.org/wikipedia/en/a/a5/Grand_Theft_Auto_V.png',
            url: 'https://example.com/gta5'
          },
          {
            name: 'Fortnite',
            genres: 'Survival, battle royale, sandbox',
            image: 'https://imgix.ranker.com/user_node_img/3837/76737071/original/76737071-photo-u8?auto=format&q=60&fit=fill&fm=pjpg&dpr=2&crop=faces&bg=fff&h=300&w=300',
            url: 'https://example.com/minecraft'
          },
          {
            name: 'Super Smash Bros. Ultimate',
            genres: 'Fighting',
            image: 'https://imgix.ranker.com/user_node_img/4269/85375035/original/super-smash-bros-ultimate-photo-u2?auto=format&q=60&fit=fill&fm=pjpg&dpr=2&crop=faces&bg=fff&h=300&w=300',
            url: 'https://example.com/gta5'
          },
          {
            name: 'Red Dead Redemption II',
            genres: 'Action-adventure',
            image: 'https://upload.wikimedia.org/wikipedia/en/4/44/Red_Dead_Redemption_II.jpg',
            url: 'https://example.com/minecraft'
          },
          {
            name: 'Among Us',
            genres: 'Party video game, survival video game',
            image: 'https://imgix.ranker.com/user_node_img/4270/85381195/original/among-us-u1?auto=format&q=60&fit=fill&fm=pjpg&dpr=2&crop=faces&bg=fff&h=300&w=300',
            url: 'https://example.com/gta5'
          }
    ];

    // games 변수를 EJS 템플릿으로 전달합니다.
    res.render('popular', { games: games });
});

app.get('/recommend.html', (req, res) => {
    const imageUrl1 = '/public/img/reco1.png';
    const imageUrl2 = '/public/img/reco2.png';
    res.render('recommend', { imageUrl1, imageUrl2 }); // imageUrl1과 imageUrl2를 객체로 전달
});

app.get('/gamedetail.html', function(req, res) {
  var game = {
      // ...other properties...
      relatedGames: [
          { title: 'Related game 1', image: '/public/img/gameing1.jpg' },
          { title: 'Related game 2', image: '/public/img/gaming2.jpg' },
          { title: 'Related game 3', image: '/public/img/gaming3.jpg' },
          { title: 'Related game 4', image: '/public/img/gaming4.jpg' }
          // ...more related games...
      ]
  };
  res.render('gamedetail', { game: game });
});

