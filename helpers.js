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

module.exports = {
  generateRandomString,
  urlsForUser,
  getUserByEmail
};