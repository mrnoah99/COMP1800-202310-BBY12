require("dotenv").config();
require("./utils.js");

const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const bcrypt = require("bcrypt");
const saltRounds = 16;
const Joi = require("joi");

const app = express();

const port = process.env.PORT || 3200;

const expireTime = 24 * 60 * 60 * 1000;

const mongodb_host = process.env.MONGODB_HOST;
const mongodb_user = process.env.MONGODB_USER;
const mongodb_password = process.env.MONGODB_PASSWORD;
const mongodb_database = process.env.MONGODB_DATABASE;
const mongodb_session_secret = process.env.MONGODB_SESSION_SECRET;

var {database} = include('databaseConnection');

const userCollection = database.db(mongodb_database).collection('users');

app.use(express.urlencoded({extended: false}));

var mongoStore = MongoStore.create({
    mongoUrl: `mongodb+srv://${mongodb_user}:${mongodb_password}@${mongodb_host}/sessions`,
    crypto: {
            secret: mongodb_session_secret
    }
});

app.set('view engine', 'ejs');

app.use(session({
    secret: mongodb_session_secret,
        store: mongoStore,
        saveUninitialized: false,
        resave: true
}));

app.get("/", (req, res) => {
    if (!req.session.authenticated) {
        res.redirect("/login");
    } else if (req.session.authenticated) {
        res.render("index");
    }
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.get("/profile", (req, res) => {
    if (req.session.authenticated) {
        res.redirect("/login");
    } else if (req.session.authenticated) {
        res.render("profile")
    }
});

app.get("/signup", (req, res) => {
    res.render("signup");
});

app.get("/home", (req, res) => {
    res.render("index");
});

app.get("*", (req, res) => {
    res.send("<h1>Error 404, Page not found!</h1>");
});

app.listen(port, () => {
    console.log(`BBY12 COMP2800 Project app started on port ${port}!`)
})