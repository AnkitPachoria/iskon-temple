import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Form from './components/Form';  
import Dashboard from './components/Dashboard';  

const App = () => {
  const navigate = useNavigate(); 
  
  useEffect(() => {
    const token = localStorage.getItem('token'); 
    if (token) {
      navigate('/dashboard');  
    } else {
      navigate('/');  
    }
  }, [navigate]); 

  return (  
    <Routes>
      <Route path="/" element={<Form />} />  
      <Route path="/dashboard" element={<Dashboard />} />  
    </Routes>
  );
};
const AppWrapper = () => {
  return (
    <Router>
      <App />
    </Router>
  );
};  

export default AppWrapper;
