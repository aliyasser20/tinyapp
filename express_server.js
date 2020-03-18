const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

const app = express();
const PORT = 3000; // default port 8080

app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");

// ! Global Variables
const generateRandomString = () => {
  const alphabetLowerAndCapital = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let encodedString = "";

  for (let i = 0; i < 6; i++) {
    const randomNumberOrLetter = Math.round(Math.random());
    const randomNumber = Math.floor(Math.random() * 9);
    const randomLetterIndex = Math.ceil(Math.random() * 51);
    if (randomNumberOrLetter) {
      encodedString += alphabetLowerAndCapital[randomLetterIndex];
    } else {
      encodedString += randomNumber;
    }
  }

  return encodedString;
};

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {};

const emailExistChecker = (usersDb, email) => {
  for (let key in usersDb) {
    if (usersDb[key].email === email) {
      return true;
    }
  }
  return false;
};

// !

// ! GETS
app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  const currentUserId = req.cookies["user_id"];
  const templateVars = {urls: urlDatabase, user: users[currentUserId]};
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const currentUserId = req.cookies["user_id"];
  const templateVars = {user: users[currentUserId]};
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const currentUserId = req.cookies["user_id"];
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    user: users[currentUserId]
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.get("/register" , (req, res) => {
  const currentUserId = req.cookies["user_id"];
  const templateVars = {user: users[currentUserId]};

  res.render("urls_register", templateVars);
});

app.get("/login", (req, res) => {
  const currentUserId = req.cookies["user_id"];
  const templateVars = {user: users[currentUserId]};
  res.render("login", templateVars);
});

// !

// ! POSTS
app.post("/urls", (req, res) => {
  const newShortURL = generateRandomString();
  urlDatabase[newShortURL] = req.body.longURL;
  res.redirect(`/urls/${newShortURL}`);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

app.post("/urls/:shortURL/put", (req, res) => {
  urlDatabase[req.params.shortURL] = req.body.newURL;
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  for (let key in users) {
    if (users[key].email === req.body.email && users[key].password === req.body.password) {
      res.cookie("user_id", users[key].id);
    }
  }
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

app.post("/register", (req, res) => {
  const newId = generateRandomString();
  if (req.body.email.length === 0 || req.body.password.length === 0 || emailExistChecker(users, req.body.email)) {
    res.statusCode = 400;
    res.send("Email already exists");
  } else {
    users[newId] = {
      id: newId,
      email: req.body.email,
      password: req.body.password
    };
    res.cookie("user_id", newId);
    res.redirect("/urls");
  }
});

// !

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});