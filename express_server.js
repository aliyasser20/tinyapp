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
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "aJ48lW"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "aJ48lW"
  }
};

const users = {
  "aJ48lW": {
    id: "aJ48lW",
    email: "test@test.com",
    password: "test",
  }
};

const emailExistChecker = (usersDb, email) => {
  for (let key in usersDb) {
    if (usersDb[key].email === email) {
      return true;
    }
  }
  return false;
};

const urlsForUser = (URLsDb, userID) => {
  const userUrls = {};

  for (let key in URLsDb) {
    if (URLsDb.hasOwnProperty(key)) {
      URLsDb[key].userID === userID ? userUrls[key] = URLsDb[key] : null;
    }
  }

  return userUrls;
};

// !

// ! GETS
app.get("/", (req, res) => {
  const currentUserId = req.cookies["user_id"];
  if (currentUserId) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

app.get("/urls", (req, res) => {
  const currentUserId = req.cookies["user_id"];
  const templateVars = {urls: urlsForUser(urlDatabase, currentUserId), user: users[currentUserId]};
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const currentUserId = req.cookies["user_id"];
  if (users[currentUserId]) {
    const templateVars = {user: users[currentUserId]};
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

app.get("/urls/:shortURL", (req, res) => {
  const currentUserId = req.cookies["user_id"];

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

app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL]) {
    const longURL = urlDatabase[req.params.shortURL].longURL;
    res.redirect(longURL);
  } else {
    res.statusCode = 404;
    res.render("error", {code: "404", description: "Page Not Found"});
  }
});

app.get("/register" , (req, res) => {
  const currentUserId = req.cookies["user_id"];
  if (currentUserId) {
    res.redirect("/urls");
  } else {
    res.render("urls_register", {user: undefined, error: undefined});
  }
});

app.get("/login", (req, res) => {
  const currentUserId = req.cookies["user_id"];
  if (currentUserId) {
    res.redirect("/urls");
  } else {
    res.render("login", {user: undefined, error: undefined});
  }
});

// !

// ! POSTS
app.post("/urls", (req, res) => {
  const currentUserId = req.cookies["user_id"];
  if (users[currentUserId]) {
    console.log("reached");
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

app.post("/urls/:shortURL/delete", (req, res) => {
  const currentUserId = req.cookies["user_id"];

  if (users[currentUserId] && urlDatabase[req.params.shortURL].userID === currentUserId) {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  } else {
    res.statusCode = 403;
    res.render("error", {code: "403", description: "Access Forbidden"});
  }
});

app.post("/urls/:shortURL", (req, res) => {
  const currentUserId = req.cookies["user_id"];

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

app.post("/login", (req, res) => {
  let inSuccessful = true;
  for (let key in users) {
    if (users[key].email === req.body.email && users[key].password === req.body.password) {
      res.cookie("user_id", users[key].id);
      res.redirect("/urls");
      inSuccessful = false;
    }
  }

  if (inSuccessful) {
    res.statusCode = 400;
    res.render("login", {user: undefined, error: "Incorrect email or password!"});
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

app.post("/register", (req, res) => {
  const newId = generateRandomString();
  
  if (req.body.email.length === 0 || req.body.password.length === 0) {
    res.statusCode = 400;
    res.render("urls_register", {user: undefined, error: "Email and password can not be empty!"});
  }
  if (emailExistChecker(users, req.body.email)) {
    res.statusCode = 400;
    res.render("urls_register", {user: undefined, error: "Email already exists!"});
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