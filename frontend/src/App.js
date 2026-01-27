import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import AICounsellor from './pages/AICounsellor';
import Universities from './pages/Universities';
import LiveUniversities from './pages/LiveUniversities';
import ApplicationGuide from './pages/ApplicationGuide';
import Profile from './pages/Profile';

// Components
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Landing />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/signup" element={user ? <Navigate to="/dashboard" /> : <Signup />} />
      
      {/* Onboarding - requires auth but not completed onboarding */}
      <Route path="/onboarding" element={
        <ProtectedRoute>
          <Onboarding />
        </ProtectedRoute>
      } />
      
      {/* Protected Routes - require auth + onboarding */}
      <Route path="/dashboard" element={
        <ProtectedRoute requireOnboarding>
          <Layout><Dashboard /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/counsellor" element={
        <ProtectedRoute requireOnboarding>
          <Layout><AICounsellor /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/universities" element={
        <ProtectedRoute requireOnboarding>
          <Layout><Universities /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/live-universities" element={
        <ProtectedRoute requireOnboarding>
          <Layout><LiveUniversities /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/application" element={
        <ProtectedRoute requireOnboarding>
          <Layout><ApplicationGuide /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute requireOnboarding>
          <Layout><Profile /></Layout>
        </ProtectedRoute>
      } />
    </Routes>
  );
}

export default App;
