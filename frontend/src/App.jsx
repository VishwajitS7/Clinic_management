import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/common/Navbar';
import HealthCheckPage from './pages/HealthCheckPage';
import ArchitecturePage from './pages/ArchitecturePage';

function App() {
  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar />
      <main className="flex-grow-1">
        <Routes>
          <Route path="/" element={<HealthCheckPage />} />
          <Route path="/architecture" element={<ArchitecturePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="border-top py-3 bg-white text-center text-muted small">
        <div className="container">
          Clinic Appointment Manager &bull; Campus Recruitment Technical Project &bull; Phase 1 Foundation
        </div>
      </footer>
    </div>
  );
}

export default App;
