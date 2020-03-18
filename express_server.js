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

  if (users[currentUserId] && users[currentUserId][req.params.shortURL]) {
    const templateVars = {
      shortURL: req.params.shortURL,
      longURL: urlDatabase[req.params.shortURL].longURL,
      user: users[currentUserId]
    };
    res.render("urls_show", templateVars);
  } else {
    res.redirect("/login");
  }
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
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
  const currentUserId = req.cookies["user_id"];

  if (users[currentUserId]) {
    const newShortURL = generateRandomString();
    urlDatabase[newShortURL] = {
      longURL: req.body.longURL,
      userID: currentUserId
    };
    res.redirect(`/urls/${newShortURL}`);
  } else {
    res.redirect("/login");
  }
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const currentUserId = req.cookies["user_id"];

  if (users[currentUserId] && users[currentUserId][req.params.shortURL]) {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  } else {
    res.statusCode = 403;
    res.send("Error: 403\n");
  }
});

app.post("/urls/:shortURL/put", (req, res) => {
  const currentUserId = req.cookies["user_id"];

  if (users[currentUserId] && users[currentUserId][req.params.shortURL]) {
    urlDatabase[req.params.shortURL] = {
      ...urlDatabase[req.params.shortURL],
      longURL: req.body.newURL,
    };
    res.redirect("/urls");
  } else {
    res.statusCode = 403;
    res.send("Error: 403\n");
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
    res.statusCode = 403;
    res.redirect("/login");
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

app.post("/register", (req, res) => {
  const newId = generateRandomString();
  if (req.body.email.length === 0 || req.body.password.length === 0 || emailExistChecker(users, req.body.email)) {
    res.statusCode = 400;
    res.redirect("/register");
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