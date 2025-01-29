  import express from 'express';
  import cors from 'cors';
  import dotenv from 'dotenv';
  import cookieParser from 'cookie-parser';
  import morgan from 'morgan';
  import helmet from 'helmet';
  import mysql from 'mysql2';
  import jwt from 'jsonwebtoken';
  import path from "path";

  
  dotenv.config(); 
  const app = express();

  // Database connection using mysql2
  const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',  // Ensure to update your MySQL password if necessary
    database: process.env.DB_NAME || 'japmala',  // Database name
  });
  

  // Connect to the database
  db.connect((err) => {
    if (err) {
      console.error('Database connection failed:', err.stack);
      return; 
    }
    console.log('Connected to the japmala database!');
  });

  app.get("/",(rew,res) => {
    app.use(express.static(path.resolve(__dirname,"frontend","build")));
    res.sendFile(path.resolve(__dirname,"frontend","build","index.html"))
  })

  // CORS configuration to allow frontend requests
  app.use(cors({
    origin: process.env.REACT_APP_FRONTEND_URL,  // React app URL, e.g. 'https://iskcon.wa1.online'
    credentials: true, 
  }));

  // Middleware setup
  app.use(express.json());
  app.use(cookieParser());
  app.use(morgan('dev'));
  app.use(helmet());
 
  // Authentication middleware to check for JWT token in Authorization header
  const authenticateToken = (req, res, next) => {
    const authHeader = req.header('Authorization');
    if (!authHeader) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];  // Extract token from the Authorization header
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    // Verify the JWT token using the secret from the .env file
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({ message: 'Invalid or expired token.' });
      }
      req.user = user;  // Attach user information to the request object
      next();
    });
  };  

  // API endpoint to submit user data (name, mobile, location, dob)
  app.post('/api/user/submit', (req, res) => {
    const { name, mobile, location, dob } = req.body;

    // If only mobile is provided, check if the user exists by mobile number
    if (mobile && !name && !location && !dob) {
      // Check if the user exists based on mobile number
      const checkQuery = 'SELECT * FROM user WHERE mobile = ?';
      db.query(checkQuery, [mobile], (err, result) => {
        if (err) {    
          console.error('Error checking if user exists:', err);
          return res.status(500).json({ message: 'Error checking user' });
        }  

        if (result.length > 0) {
          // If user already exists, return a success message with user data
          const token = jwt.sign({ user_Id: result[0].id }, process.env.JWT_SECRET, { expiresIn: '1d' });
          return res.json({ message: 'Login successful!', token, user: result[0] });
        } else {
          return res.status(404).json({ message: 'User not found' });
        }
      });
    } else if (name && mobile && location && dob) {
      // If all fields are filled, check if the user already exists based on all fields
      const checkQuery = 'SELECT * FROM user WHERE name = ? AND mobile = ? AND location = ?';
      db.query(checkQuery, [name, mobile, location], (err, result) => {
        if (err) {
          console.error('Error checking if user exists:', err);
          return res.status(500).json({ message: 'Error checking user' });
        }

        if (result.length > 0) {
          // If user already exists, return a success message with user data
          const token = jwt.sign({ user_Id: result[0].id }, process.env.JWT_SECRET, { expiresIn: '1d' });
          return res.json({ message: 'Login successful!', token, user: result[0] });
        }
        
        // If user doesn't exist, insert new user into the database with DOB
        const query = 'INSERT INTO user (name, mobile, location, dob) VALUES (?, ?, ?, ?)';
        db.query(query, [name, mobile, location, dob], (err, result) => {
          if (err) {
            console.error('Error inserting user data:', err);
            return res.status(500).json({ message: 'Error submitting data' });
          }

          // Generate JWT token after successful user data submission
          const token = jwt.sign({ user_Id: result.insertId }, process.env.JWT_SECRET, { expiresIn: '1d' });
          res.json({ message: 'User data submitted successfully!', token });
        });
      });
    } else {
      return res.status(400).json({ message: 'All fields are required' });
    }
  });

  // API endpoint to fetch user details (name, mobile, location, dob)
  app.get('/api/user/details', authenticateToken, (req, res) => {
    const user_Id = req.user.user_Id;

    const query = 'SELECT name, mobile, location, dob FROM user WHERE id = ?';
    db.query(query, [user_Id], (err, result) => {
      if (err) {
        console.error('Error fetching user details:', err);
        return res.status(500).json({ message: 'Error fetching user details' });
      }

      if (result.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({ user: result[0] });
    });
  });

  // API endpoint to check if data already exists for a specific date and user (japtable)
  app.get('/api/jap/check/:date', authenticateToken, (req, res) => {
    const { date } = req.params;
    const user_Id = req.user.user_Id;

    // Validate the date format using a regex (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!date.match(dateRegex)) {
      return res.status(400).json({ message: 'Invalid date format. Use YYYY-MM-DD.' });
    }

    // SQL query to check if there's an entry for the given date and user
    const query = 'SELECT * FROM entries WHERE DATE(date) = ? AND user_Id = ? LIMIT 1';
    db.query(query, [date, user_Id], (err, result) => {
      if (err) {
        console.error('Error checking data:', err);
        return res.status(500).json({ message: 'Error checking data' });
      }

      if (result.length > 0) {
        return res.status(200).json({ message: 'Data already exists for today' });
      }

      return res.status(200).json({ message: 'No data for today' });
    });
  });

  // API endpoint to submit Jap data (date and japqty) for a user
  app.post('/api/jap/submit', authenticateToken, (req, res) => {
    const { date, japqty } = req.body;
    const user_Id = req.user.user_Id;

    // Validate required fields
    if (!date || !japqty) {
      return res.status(400).json({ message: 'Date and Japqty are required' });
    }

    // First, check if data already exists for the given date and user
    const checkQuery = 'SELECT * FROM entries WHERE DATE(date) = ? AND user_Id = ? LIMIT 1';
    db.query(checkQuery, [date, user_Id], (err, result) => {
      if (err) {
        console.error('Error checking existing data:', err);
        return res.status(500).json({ message: 'Error checking data' });
      }

      // If data already exists for the date and user, return a message
      if (result.length > 0) {
        return res.status(400).json({ message: 'Data already exists for today. Cannot submit again.' });
      }

      // Insert new Jap data for the given date, quantity, and user_Id
      const insertQuery = 'INSERT INTO entries(date, japqty, user_Id) VALUES (?, ?, ?)';
      db.query(insertQuery, [date, japqty, user_Id], (err, result) => {
        if (err) {
          console.error('Error inserting Jap data:', err);
          return res.status(500).json({ message: 'Failed to store Jap data' });
        }

        // Get the total count of entries for the day for this user
        const countQuery = 'SELECT COUNT(*) AS total FROM entries WHERE DATE(date) = ? AND user_Id = ?';
        db.query(countQuery, [date, user_Id], (err, countResult) => {
          if (err) {
            console.error('Error counting entries:', err);
            return res.status(500).json({ message: 'Failed to fetch today\'s count' });
          }

          const totalToday = countResult[0].total || 0;
          res.json({ message: 'Data submitted successfully!', totalToday });
        });
      });
    });
  });

  // API endpoint to fetch daily, monthly, and yearly jap count for a user
  app.get('/api/jap/counts', authenticateToken, (req, res) => {
    const user_Id = req.user.user_Id;

    const dailyQuery = 'SELECT COUNT(*) AS dailyCount FROM entries WHERE DATE(date) = CURDATE() AND user_Id = ?';
    const monthlyQuery = 'SELECT COUNT(*) AS monthlyCount FROM entries WHERE YEAR(date) = YEAR(CURDATE()) AND MONTH(date) = MONTH(CURDATE()) AND user_Id = ?';
    const yearlyQuery = 'SELECT COUNT(*) AS yearlyCount FROM entries WHERE YEAR(date) = YEAR(CURDATE()) AND user_Id = ?';

    // Run all queries
    db.query(dailyQuery, [user_Id], (err, dailyResult) => {
      if (err) {
        console.error('Error fetching daily count:', err);
        return res.status(500).json({ message: 'Error fetching daily count' });
      }

      db.query(monthlyQuery, [user_Id], (err, monthlyResult) => {
        if (err) {
          console.error('Error fetching monthly count:', err);
          return res.status(500).json({ message: 'Error fetching monthly count' });
        }

        db.query(yearlyQuery, [user_Id], (err, yearlyResult) => {
          if (err) {
            console.error('Error fetching yearly count:', err);
            return res.status(500).json({ message: 'Error fetching yearly count' });
          }

          // Return the results as a response
          res.json({
            dailyCount: dailyResult[0].dailyCount,
            monthlyCount: monthlyResult[0].monthlyCount,
            yearlyCount: yearlyResult[0].yearlyCount,
          });
        });
      });
    });
  });

  // Starting the server
  const PORT = process.env.PORT || 8081;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
 
  