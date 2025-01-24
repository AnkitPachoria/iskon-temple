import mysql from 'mysql2';

// Create MySQL connection using XAMPP credentials
  const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',  // Ensure to update your MySQL password if necessary
    database: process.env.DB_NAME || 'japmala',  // Database name
  });

// Connect to MySQL
db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err.stack);
    return;
  }
  console.log('Connected to the japmala database!');
});

export default db;
