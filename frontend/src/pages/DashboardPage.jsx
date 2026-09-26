import React from 'react';
import { Container, Row, Col, Card, Badge, Alert, Button } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const DashboardPage = () => {
  const { user, doctor } = useAuth();

  const getRoleVariant = (role) => {
    switch (role) {
      case 'ADMIN':
        return 'primary';
      case 'DOCTOR':
        return 'success';
      case 'RECEPTIONIST':
        return 'info';
      default:
        return 'secondary';
    }
  };

  return (
    <Container className="py-4">
      {/* Welcome Banner */}
      <Card className="clinic-card border-0 shadow-sm mb-4 bg-primary text-white p-4">
        <Row className="align-items-center">
          <Col md={8}>
            <div className="d-flex align-items-center gap-2 mb-2">
              <Badge bg="light" text="dark" className="px-2 py-1 text-uppercase fw-bold">
                {user?.role} PORTAL
              </Badge>
              {doctor && (
                <Badge bg="warning" text="dark" className="px-2 py-1">
                  {doctor.specialization}
                </Badge>
              )}
            </div>
            <h2 className="fw-bold mb-1">Welcome back, {user?.name}!</h2>
            <p className="mb-0 text-white-50">
              Authenticated securely via JWT. Role permissions strictly enforced on both client and Express server.
            </p>
          </Col>
          <Col md={4} className="text-md-end mt-3 mt-md-0">
            <div className="bg-white text-dark p-3 rounded shadow-sm d-inline-block text-start">
              <div className="small text-muted fw-semibold">SESSION DETAILS</div>
              <div className="fw-bold">{user?.email}</div>
              <div className="small text-muted">ID: {user?._id?.slice(-8)}</div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Role-Specific Capabilities */}
      <Row className="g-4 mb-4">
        <Col md={4}>
          <Card className="clinic-card border-0 shadow-sm h-100">
            <Card.Body>
              <div className="d-flex align-items-center gap-2 mb-3">
                <div className="p-2 rounded bg-primary-subtle text-primary">
                  <i className="bi bi-shield-lock fs-5"></i>
                </div>
                <h5 className="fw-bold mb-0">Role Authorization</h5>
              </div>
              <p className="text-muted small">
                Your account is authenticated as <strong>{user?.role}</strong>. Backend endpoints verify your role via
                <code>authorizeRoles('{user?.role}')</code> middleware.
              </p>
              <div className="p-2 bg-light rounded small font-monospace">
                JWT verified &bull; Token active
              </div>
            </Card.Body>
          </Card>
        </Col>

        {user?.role === 'DOCTOR' && doctor && (
          <Col md={4}>
            <Card className="clinic-card border-0 shadow-sm h-100">
              <Card.Body>
                <div className="d-flex align-items-center gap-2 mb-3">
                  <div className="p-2 rounded bg-success-subtle text-success">
                    <i className="bi bi-heart-pulse fs-5"></i>
                  </div>
                  <h5 className="fw-bold mb-0">Doctor Profile</h5>
                </div>
                <div className="small">
                  <div className="mb-1"><strong>Specialization:</strong> {doctor.specialization}</div>
                  <div className="mb-1"><strong>Qualification:</strong> {doctor.qualification}</div>
                  <div className="mb-1"><strong>Experience:</strong> {doctor.experienceYears} Years</div>
                  <div className="mb-1"><strong>License:</strong> {doctor.licenseNumber}</div>
                  <div><strong>Consultation Fee:</strong> ₹{doctor.consultationFee}</div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        )}

        <Col md={user?.role === 'DOCTOR' ? 4 : 8}>
          <Card className="clinic-card border-0 shadow-sm h-100">
            <Card.Body>
              <div className="d-flex align-items-center gap-2 mb-3">
                <div className="p-2 rounded bg-info-subtle text-info">
                  <i className="bi bi-check-circle fs-5"></i>
                </div>
                <h5 className="fw-bold mb-0">Assigned Responsibilities</h5>
              </div>
              {user?.role === 'ADMIN' && (
                <ul className="small text-muted ps-3 mb-0">
                  <li>Full administrative supervision over Doctors, Patients, Schedules</li>
                  <li>Access to Revenue, Invoice adjustments, and clinic-wide analytics</li>
                  <li>Can view all Appointments, Consultations, and Prescriptions</li>
                </ul>
              )}
              {user?.role === 'DOCTOR' && (
                <ul className="small text-muted ps-3 mb-0">
                  <li>View daily schedule and assigned patient queues</li>
                  <li>Record clinical symptoms, diagnoses, and follow-up intervals</li>
                  <li>Create and edit prescriptions with embedded medicines</li>
                </ul>
              )}
              {user?.role === 'RECEPTIONIST' && (
                <ul className="small text-muted ps-3 mb-0">
                  <li>Register and search patient records</li>
                  <li>Schedule, confirm, reschedule, and cancel appointments</li>
                  <li>Generate invoices and record partial/full payments</li>
                </ul>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Quick Navigation Cards */}
      <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
        <i className="bi bi-grid text-primary"></i> Module Directory (Upcoming Phases)
      </h5>
      <Row className="g-3">
        <Col sm={6} md={3}>
          <Card
            as={Link}
            to="/patients"
            className="clinic-card border-0 shadow-sm text-center p-3 h-100 text-decoration-none"
            style={{ cursor: 'pointer' }}
          >
            <i className="bi bi-people fs-2 text-primary mb-2"></i>
            <h6 className="fw-bold mb-1 text-dark">Patients</h6>
            <p className="text-muted small mb-0">Directory & Dossiers</p>
          </Card>
        </Col>
        <Col sm={6} md={3}>
          <Card className="clinic-card border-0 shadow-sm text-center p-3 h-100">
            <i className="bi bi-person-badge fs-2 text-success mb-2"></i>
            <h6 className="fw-bold mb-1">Doctors</h6>
            <p className="text-muted small mb-0">Phase 5 Profiles</p>
          </Card>
        </Col>
        <Col sm={6} md={3}>
          <Card className="clinic-card border-0 shadow-sm text-center p-3 h-100">
            <i className="bi bi-calendar3 fs-2 text-warning mb-2"></i>
            <h6 className="fw-bold mb-1">Appointments</h6>
            <p className="text-muted small mb-0">Phase 7 Conflict Engine</p>
          </Card>
        </Col>
        <Col sm={6} md={3}>
          <Card className="clinic-card border-0 shadow-sm text-center p-3 h-100">
            <i className="bi bi-receipt fs-2 text-danger mb-2"></i>
            <h6 className="fw-bold mb-1">Billing & Invoices</h6>
            <p className="text-muted small mb-0">Phase 10 Financials</p>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default DashboardPage;
