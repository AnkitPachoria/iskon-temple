// submitForm.js
import { createUser } from '../models/user.js';
import jwt from 'jsonwebtoken';

// Submit user form data
const submitForm = (req, res) => {
  const { name, mobile, location, dob } = req.body;

  // Input validation
  if (!name || !mobile || !location || !dob) {
    return res.status(400).json({ message: 'All fields are required!' });
  }

  // Check if user already exists
  const checkQuery = 'SELECT * FROM user WHERE name = ? AND mobile = ? AND location = ?';
  db.query(checkQuery, [name, mobile, location], (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }

    if (result.length > 0) {
      // User exists, generate JWT token and return user data
      const token = jwt.sign({ user_Id: result[0].id }, process.env.JWT_SECRET, { expiresIn: '1d' });
      return res.json({ message: 'Login successful!', token, user: result[0] });
    }

    // If user doesn't exist, create a new user
    createUser(name, mobile, location, dob, (err, result) => {
      if (err) {
        return res.status(500).json({ message: 'Database error' });
      }

      // Generate JWT token after successful submission
      const token = jwt.sign({ user_Id: result.insertId }, process.env.JWT_SECRET, { expiresIn: '1d' });
      res.status(201).json({ message: 'User data submitted successfully!', token });
    });
  });
};

export { submitForm };
