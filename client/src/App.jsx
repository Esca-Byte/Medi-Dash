import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import Dashboard from './components/Dashboard';
import DoctorDashboard from './components/DoctorDashboard';
import Appointments from './components/Appointments';
import DoctorSearch from './components/DoctorSearch';
import Login from './components/Login';
import Register from './components/Register';
import { NotificationProvider } from './context/NotificationContext';


import Settings from './components/Settings';
import Chatbot from './components/Chatbot';
import MedicineReminder from './components/MedicineReminder';
import ChatPanel from './components/ChatPanel';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState('patient');
  const [userId, setUserId] = useState(null);

  // Load session from localStorage on mount
  useEffect(() => {
    const savedAuth = localStorage.getItem('auth');
    if (savedAuth) {
      const { role, id } = JSON.parse(savedAuth);
      setRole(role);
      setUserId(id);
      setIsAuthenticated(true);
    }

    // Check for dark mode preference
    const isDark = localStorage.getItem('theme') === 'dark';
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const handleLogin = (userData) => {
    setRole(userData.role);
    setUserId(userData.id);
    setIsAuthenticated(true);
    localStorage.setItem('auth', JSON.stringify({ role: userData.role, id: userData.id, name: userData.name }));
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setRole('patient');
    setUserId(null);
    localStorage.removeItem('auth');
  };

  return (
    <NotificationProvider>
      <ErrorBoundary>
        <Router>
          {!isAuthenticated ? (
            <Routes>
              <Route path="/register" element={<Register onLogin={handleLogin} />} />
              <Route path="*" element={<Login onLogin={handleLogin} />} />
            </Routes>
          ) : (
            <Layout role={role} onLogout={handleLogout} userId={userId}>
              <Routes>
                <Route path="/" element={<Navigate to={`/${role}`} replace />} />
                <Route path="/patient" element={<Dashboard userId={userId} />} />
                <Route path="/patient/vitals" element={<Dashboard userId={userId} />} />
                <Route path="/doctor" element={<DoctorDashboard userId={userId} />} />
                <Route path="/find-doctors" element={<DoctorSearch userId={userId} />} />
                <Route path="/appointments" element={<Appointments userId={userId} />} />
                <Route path="/settings" element={<Settings userId={userId} role={role} />} />
                <Route path="/chat" element={<ChatPanel userId={userId} role={role} />} />
              </Routes>
              <Chatbot />
              <MedicineReminder />
            </Layout>
          )}
        </Router>
      </ErrorBoundary>
    </NotificationProvider>
  );
}

export default App;
