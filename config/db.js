import mysql from 'mysql2';

// Create MySQL connection using XAMPP credentials
const db = mysql.createConnection({
  host: '91.108.107.88',
  user: 'u274451955_iskon_usm',
  password: '1OgM!/6U>r',  // Empty password for XAMPP default MySQL setup
  database: 'u274451955_iskon_dbm',  // Your database name
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
 