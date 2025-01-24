// user.js (Model)
import db from '../config/db.js';

// Create a new user
const createUser = (name, mobile, location, dob, callback) => {
  const query = 'INSERT INTO user (name, mobile, location, dob) VALUES (?, ?, ?, ?)';
  db.query(query, [name, mobile, location, dob], (err, result) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, result);
    }
  });
};

export { createUser };
