// ! Package Imports
const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const cookieSession = require("cookie-session");
// !

// ! Module Imports
const {generateRandomString, urlsForUser, getUserByEmail} = require("./helpers");
// !

// ! Setup
const app = express();
const PORT = 3000; // default port 8080

app.use(cookieSession({
  name: "session",
  keys: ["user_id"],

  maxAge: 60 * 60 * 1000 // 1 hour
}));
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
// !

// ! Global Variables
const urlDatabase = {};
const users = {};
// !

// ! GETS
// ? Root
app.get("/", (req, res) => {
  const currentUserId = req.session.user_id;
  if (currentUserId) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

// ? URLs
app.get("/urls", (req, res) => {
  const currentUserId = req.session.user_id;
  const templateVars = {urls: urlsForUser(urlDatabase, currentUserId), user: users[currentUserId]};
  res.render("urls_index", templateVars);
});

// ? New URL
app.get("/urls/new", (req, res) => {
  const currentUserId = req.session.user_id;
  if (users[currentUserId]) {
    const templateVars = {user: users[currentUserId]};
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

// ? Edit URL
app.get("/urls/:shortURL", (req, res) => {
  const currentUserId = req.session.user_id;
  
  if (!urlDatabase[req.params.shortURL]) {
    res.statusCode = 404;
    res.render("error", {code: "404", description: "Page Not Found"});
  } else if (users[currentUserId] && urlDatabase[req.params.shortURL].userID === currentUserId) {
    const templateVars = {
      shortURL: req.params.shortURL,
      longURL: urlDatabase[req.params.shortURL].longURL,
      user: users[currentUserId]
    };
    res.render("urls_show", templateVars);
  } else {
    res.statusCode = 403;
    res.render("error", {code: "403", description: "Access Forbidden"});
  }
});

// ? Redirect to long URL
app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL]) {
    const longURL = urlDatabase[req.params.shortURL].longURL;
    res.redirect(longURL);
  } else {
    res.statusCode = 404;
    res.render("error", {code: "404", description: "Page Not Found"});
  }
});

// ? Register
app.get("/register" , (req, res) => {
  const currentUserId = req.session.user_id;
  if (currentUserId) {
    res.redirect("/urls");
  } else {
    res.render("urls_register", {user: undefined, error: undefined});
  }
});

// ? Login
app.get("/login", (req, res) => {
  const currentUserId = req.session.user_id;
  if (currentUserId) {
    res.redirect("/urls");
  } else {
    res.render("login", {user: undefined, error: undefined});
  }
});
// !

// ! POSTS
// ? Create new URL
app.post("/urls", (req, res) => {
  const currentUserId = req.session.user_id;
  if (users[currentUserId]) {
    const newShortURL = generateRandomString();
    urlDatabase[newShortURL] = {
      longURL: req.body.longURL,
      userID: currentUserId
    };
    res.redirect(`/urls/${newShortURL}`);
  } else {
    res.statusCode = 403;
    res.render("error", {code: "403", description: "Access Forbidden"});
  }
});

// ? Delete URL
app.post("/urls/:shortURL/delete", (req, res) => {
  const currentUserId = req.session.user_id;
  
  if (users[currentUserId] && urlDatabase[req.params.shortURL].userID === currentUserId) {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  } else {
    res.statusCode = 403;
    res.render("error", {code: "403", description: "Access Forbidden"});
  }
});

// ? Edit URL
app.post("/urls/:shortURL", (req, res) => {
  const currentUserId = req.session.user_id;
  
  if (users[currentUserId] && urlDatabase[req.params.shortURL].userID === currentUserId) {
    urlDatabase[req.params.shortURL] = {
      ...urlDatabase[req.params.shortURL],
      longURL: req.body.newURL,
    };
    res.redirect("/urls");
  } else {
    res.statusCode = 403;
    res.render("error", {code: "403", description: "Access Forbidden"});
  }
});

// ? Login
app.post("/login", (req, res) => {
  const user = getUserByEmail(req.body.email, users);
  
  if (user && bcrypt.compareSync(req.body.password, user.password)) {
    req.session.user_id = user.id;
    res.redirect("/urls");
  } else {
    res.statusCode = 400;
    res.render("login", {user: undefined, error: "Incorrect email or password!"});
  }
});

// ? Logout
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

// ? Register
app.post("/register", (req, res) => {
  const newId = generateRandomString();
  
  if (req.body.email.length === 0 || req.body.password.length === 0) {
    res.statusCode = 400;
    res.render("urls_register", {user: undefined, error: "Email and/or password can not be empty!"});
  } else if (getUserByEmail(req.body.email, users)) {
    res.statusCode = 400;
    res.render("urls_register", {user: undefined, error: "Email already exists!"});
  } else {
    users[newId] = {
      id: newId,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 10)
    };
    req.session.user_id = newId;
    res.redirect("/urls");
  }
});
// !

// ! Listen to requests
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
// !