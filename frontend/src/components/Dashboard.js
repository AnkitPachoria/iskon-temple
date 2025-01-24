import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';  
import { Helmet } from 'react-helmet';
import './Dashboard.css';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [date, setDate] = useState('');
  const [japQty, setJapQty] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [canSubmit, setCanSubmit] = useState(true);
  const [japCounts, setJapCounts] = useState({ dailyCount: 0, monthlyCount: 0, yearlyCount: 0 });
  const navigate = useNavigate();
  const token = localStorage.getItem('token'); 

  // Fetch user details and check if data already exists for today
  useEffect(() => {
    if (!token) { 
      navigate('/');  
      return;
    }
    
    // Get current date
    const today = new Date();
    setDate(today.toISOString().split('T')[0]);

    fetchUserDetails();
    checkDataForToday();
    fetchJapCounts();
  }, [token, navigate]);

  // Fetch user details from the backend API
  const fetchUserDetails = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/user/details`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();
      if (result.user) {
        setUser(result.user);
      } else {
        setErrorMessage('User not found.');
      }
    } catch (error) {
      setErrorMessage('Failed to fetch user details.');
    }
  };

  // Check if the user has already submitted data for today
  const checkDataForToday = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/jap/check/${date}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();
      if (result.message === 'Data already exists for today') {
        setCanSubmit(false); // Prevent the user from submitting if data already exists
      }
    } catch (error) {
      setErrorMessage('Error checking data.');
    }
  };

  // Fetch daily, monthly, and yearly jap counts
  const fetchJapCounts = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/jap/counts`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();
      setJapCounts({
        dailyCount: result.dailyCount,
        monthlyCount: result.monthlyCount,
        yearlyCount: result.yearlyCount,
      });
    } catch (error) {
      setErrorMessage('Error fetching jap counts.');
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!japQty) {
      setErrorMessage('Please enter a valid quantity.');
      return;
    }

    if (!canSubmit) {
      setErrorMessage('You have already submitted data for today.');
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/jap/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ date, japqty: japQty }),
      });

      const result = await response.json();
      if (response.status === 200) {
        alert(result.message); // Success message
        setJapQty(''); 
        setCanSubmit(false); // Prevent further submissions for the day
        fetchJapCounts(); // Refresh counts after submission
      } else {
        setErrorMessage(result.message);
      }
    } catch (error) {
      setErrorMessage('Error during submission. Please try again.');
    }
  };

  // Handle logout and redirect to the login page
  const handleLogout = () => {
    localStorage.removeItem('token');  // Clear the token from localStorage
    navigate('/');  // Redirect to the login page
  };

  return (
    <div className="dashboard-container">
      {/* Helmet to set the meta title and description */}
      <Helmet>
        <title>Dashboard - User Overview</title>
        <meta name="description" content="View and manage your profile, track your activities, and access various tools and settings on your dashboard." />
      </Helmet>

      {user ? (
        <>
          <div className="profile-card">
            <h2>Welcome, {user.name}</h2>
            <p><strong>Mobile:</strong> {user.mobile}</p>
            <p><strong>Location:</strong> {user.location}</p>
            <p><strong>Date of Birth:</strong> {user.dob ? new Date(user.dob).toLocaleDateString() : 'Not Provided'}</p>
            <button onClick={handleLogout} className="logout-btn">Switch</button>
          </div>

          <form onSubmit={handleSubmit} className="submission-form">
            <div>
              <label>Date:</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} disabled />
            </div>
            <div>
              <label>Jap Quantity:</label>
              <input type="number" value={japQty} onChange={(e) => setJapQty(e.target.value)} />
            </div>
            {errorMessage && <p className="error">{errorMessage}</p>}
            <button type="submit" disabled={!canSubmit}>Save</button>
          </form>

          {/* Jap Counts Table */}
          <table className="jap-counts-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Count</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Today</td>
                <td>{japCounts.dailyCount}</td>
              </tr>
              <tr>
                <td> Month</td>
                <td>{japCounts.monthlyCount}</td>
              </tr>
              <tr>
                <td> Year</td>
                <td>{japCounts.yearlyCount}</td>
              </tr>
            </tbody>
          </table>
        </>
      ) : (
        <p>Loading user data...</p>
      )}
    </div>
  );
};

export default Dashboard;
