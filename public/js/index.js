const express = require("express");
const session = require("express-session");


const app = express();

app.set("view engine", "ejs");

const port = process.env.PORT || 3020;

app.get("/", (req, res) => {
    res.render("login");
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.get("/profile", (req, res) => {
    res.render("profile");
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
});
