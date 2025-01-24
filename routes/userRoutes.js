import express from 'express';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Route to check if the JWT token is valid
router.get('/check', (req, res) => {
  // Extract token from the 'Authorization' header (Bearer token)
  const token = req.headers.authorization?.split(' ')[1]; 

  if (!token) {
    return res.status(401).json({ message: 'No token provided, access denied.' });
  }

  // Verify the token using the JWT_SECRET from the environment
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      // If token is invalid or expired, return a 401 Unauthorized error
      return res.status(401).json({ message: 'Invalid or expired token.', error: err.message });
    }
    
    // If token is valid, return a success message along with the decoded user data
    res.json({
      message: 'Token is valid',
      user: decoded,  // Optionally send back the decoded user data (e.g., userId)
    });
  });
});

export default router;
 