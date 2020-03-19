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
const PORT = 8080; // default port 8080

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

// ! GETs ----------------------------------------- //
// ? Root
// Redirects to URLs page if authenticated user is logged in. Otherwise, redirects to login page.
app.get("/", (req, res) => {
  const currentUserId = req.session.user_id;

  if (users[currentUserId]) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

// ? URLs
// Renders URLs page with added template vars
app.get("/urls", (req, res) => {
  const currentUserId = req.session.user_id;
  const templateVars = {urls: urlsForUser(urlDatabase, currentUserId), user: users[currentUserId]};
  
  res.render("urls_index", templateVars);
});

// ? New URL
// Renders new URL page if authenticated user is logged in. Otherwise, redirects to login page.
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
// Renders edit URL page if authenticated user is logged in and user owns shortURL. Otherwise, renders an error page (404 Not found, if short URL is not in database OR 403 Access forbidden if user not logged in, or user logged in but does not own shortURL).
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
// Redirects user to long URL if shortURL is in database. Otherwise, renders a 404 Not found page.
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
// Renders register page if no authenticated user is logged in. Otherwise, redirects to URLs page.
app.get("/register" , (req, res) => {
  const currentUserId = req.session.user_id;

  if (currentUserId) {
    res.redirect("/urls");
  } else {
    res.render("urls_register", {user: undefined, error: undefined});
  }
});

// ? Login
// Renders login page if no authenticated user is logged in. Otherwise, redirects to URLs page.
app.get("/login", (req, res) => {
  const currentUserId = req.session.user_id;

  if (currentUserId) {
    res.redirect("/urls");
  } else {
    res.render("login", {user: undefined, error: undefined});
  }
});

// ? Any Other Path
// Renders 404 Not found page for any other path
app.get("/:anythingElse", (req, res) => {
  res.statusCode = 404;
  res.render("error", {code: "404", description: "Page Not Found"});
});
// ! ----------------------------------------- //

// ! POSTs ----------------------------------------- //
// ? Create new URL
// If authenticated user is logged in, creates new shortURL for input longURL and saves into database, then redirects to URLs page. Otherwise, renders 403 Access forbidden page.
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
// If authenticated user is logged in and owns shortURL, deletes shortURL entry in database, then redirects to URLs page. Otherwise, renders 403 Access forbidden page.
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
// If authenticated user is logged in and owns shortURL, assigns new longURL to existing shortURL entry in database, then redirects to URLs page. Otherwise, renders 403 Access forbidden page.
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
// Sets user_id of user to session encrypted cookie if email and password match users database entry, then redirects to URLS page. Otherwise, re-renders login page with added error message: Incorrect email or password.
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
// Clears session encrypted cookie of user_id, then redirects to URLs page.
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

// ? Register
// If email and password are not empty, and user does not already exist, adds user to users database and sets user_id of user to session encrypted cookie. Otherwise, re-renders register page with added error message: ("Email and/or password can not be empty!" if either fields are empty OR "Email already exists!" if user exists in database).
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
// ! ----------------------------------------- //

// ! Listen to requests
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
// !