import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/common/Navbar';
import HealthCheckPage from './pages/HealthCheckPage';
import ArchitecturePage from './pages/ArchitecturePage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProtectedRoute from './routes/ProtectedRoute';

function App() {
  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar />
      <main className="flex-grow-1">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HealthCheckPage />} />
          <Route path="/architecture" element={<ArchitecturePage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="border-top py-3 bg-white text-center text-muted small">
        <div className="container">
          Clinic Appointment Manager &bull; Campus Recruitment Technical Project &bull; Phase 3 Authenticated
        </div>
      </footer>
    </div>
  );
}

export default App;
