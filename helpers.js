// ? Function that returns the current user's object (returns undefined if not in database)
const getUserByEmail = function(email, database) {
  for (let key in database) {
    if (database.hasOwnProperty(key)) {
      if (database[key].email === email) {
        return database[key];
      }
    }
  }
  return undefined;
};

// ? Function that returns an object with urls for current user only (empty if none)
const urlsForUser = (URLsDb, userID) => {
  const userUrls = {};
  
  for (let key in URLsDb) {
    if (URLsDb.hasOwnProperty(key)) {
      URLsDb[key].userID === userID ? userUrls[key] = URLsDb[key] : null;
    }
  }
  
  return userUrls;
};

// ? Function that generates a random 6 character alphanumeric key
const generateRandomString = () => {
  const alphabetLowerAndCapital = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let encodedString = "";

  for (let i = 0; i < 6; i++) {
    // Generate random 0 or 1 (0 will add a number while 1 will add a letter)
    const randomNumberOrLetter = Math.round(Math.random());
    // Random number to add between 0 and 9
    const randomNumber = Math.floor(Math.random() * 9);
    // Random letter index
    const randomLetterIndex = Math.ceil(Math.random() * 51);
    
    if (randomNumberOrLetter) {
      encodedString += alphabetLowerAndCapital[randomLetterIndex];
    } else {
      encodedString += randomNumber;
    }
  }

  return encodedString;
};

// ? Function that returns true if URL is valid. Otherwise false.
const validateURL = (URL) => {
  const URLLowerCase = URL.toLowerCase();
  if (URLLowerCase.length === 0) {
    return false;
  }

  if (URLLowerCase.slice(0, 7) === "http://" || URLLowerCase.slice(0, 8) === "https://") {
    const URLWithoutHTTP = URLLowerCase.slice(8);
  
    if (URLWithoutHTTP.length === 0) {
      return false;
    }
    return true;
  } else {
    return false;
  }
};

// ? Function that returns true if url exists in database. False otherwise.
const URLExistsChecker = (URL, database) => {
  for (let key in database) {
    if (database.hasOwnProperty(key)) {
      if (database[key].longURL === URL) {
        return true;
      }
    }
  }
  return false;
};

module.exports = {
  generateRandomString,
  urlsForUser,
  getUserByEmail,
  validateURL,
  URLExistsChecker
};