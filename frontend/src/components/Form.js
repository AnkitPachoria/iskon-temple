// src/components/LoginForm.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';  // Import Helmet
import './Form.css';

const LoginForm = () => {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [location, setLocation] = useState('');
  const [dob, setDob] = useState('');  // dob state
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    // Validate mobile number
    if (!mobile) {
      setErrorMessage("Mobile number is required.");
      return;
    }
      
    // Validate other fields
    if ((!name || !location || !dob) && (name || location || dob)) {
      setErrorMessage("All fields are required when submitting data.");
      return;
    }
  
    const data = { name, mobile, location, dob };
  
    try {
      // API call to backend
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/user/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
         
      const result = await response.json();
      
      // Debugging: Log response to console
      console.log('API Response:', result);
    
      if (response.status === 200) {
        localStorage.setItem('token', result.token);
        navigate('/dashboard');
      } else {
        setErrorMessage(result.message || 'An error occurred. Please try again.');
      }
    } catch (error) {
      // Log the error to console for debugging
      console.error('Error during submission:', error);
      setErrorMessage('Error during submission. Please try again.');
    }
  }; 
  
  return (
    <div className="form-container">
      {/* Helmet to set the meta title and description */}
      <Helmet>
        <title>Login Form - User Registration</title>
        <meta name="description" content="Fill the form to register your details like name, mobile, location, and date of birth." />
      </Helmet>
    
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Mobile"
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
        />
        <input
          type="text"
          placeholder="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
        <input
          type="date"  // dob input type as date
          placeholder="Date of Birth"
          value={dob}
          onChange={(e) => setDob(e.target.value)}
        />
        <button type="submit">Submit</button>
        {errorMessage && <p className="error-message">{errorMessage}</p>}
      </form>
    </div>
  );
};

export default LoginForm;
