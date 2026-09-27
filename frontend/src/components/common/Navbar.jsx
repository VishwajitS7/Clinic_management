import React from 'react';
import { Navbar as BsNavbar, Container, Nav, Badge, Button } from 'react-bootstrap';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getRoleBadgeVariant = (role) => {
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
    <BsNavbar bg="white" expand="lg" className="border-bottom sticky-top py-2 shadow-sm">
      <Container>
        <BsNavbar.Brand as={Link} to={isAuthenticated ? "/dashboard" : "/"} className="d-flex align-items-center gap-2 fw-bold text-primary">
          <i className="bi bi-hospital fs-4 text-primary"></i>
          <span>Clinic Appointment Manager</span>
          <Badge bg="primary" pill className="ms-1 small fw-normal">
            v1.0
          </Badge>
        </BsNavbar.Brand>
        <BsNavbar.Toggle aria-controls="main-navbar-nav" />
        <BsNavbar.Collapse id="main-navbar-nav">
          <Nav className="ms-auto align-items-center gap-2">
            {isAuthenticated && (
              <>
                <Nav.Link as={NavLink} to="/dashboard" className="fw-medium">
                  <i className="bi bi-speedometer2 me-1"></i> Dashboard
                </Nav.Link>
                <Nav.Link as={NavLink} to="/patients" className="fw-medium">
                  <i className="bi bi-people me-1"></i> Patients
                </Nav.Link>
                <Nav.Link as={NavLink} to="/doctors" className="fw-medium">
                  <i className="bi bi-person-badge me-1"></i> Doctors
                </Nav.Link>
                <Nav.Link as={NavLink} to="/schedules" className="fw-medium">
                  <i className="bi bi-calendar-range me-1"></i> Schedules
                </Nav.Link>
                <Nav.Link as={NavLink} to="/appointments" className="fw-medium">
                  <i className="bi bi-calendar-check me-1"></i> Appointments
                </Nav.Link>
                <Nav.Link as={NavLink} to="/consultations" className="fw-medium">
                  <i className="bi bi-clipboard2-pulse me-1"></i> Consultations
                </Nav.Link>
                <Nav.Link as={NavLink} to="/prescriptions" className="fw-medium">
                  <i className="bi bi-capsule me-1"></i> Prescriptions
                </Nav.Link>
              </>
            )}
            <Nav.Link as={NavLink} to="/" end className="fw-medium">
              <i className="bi bi-activity me-1"></i> System Health
            </Nav.Link>
            <Nav.Link as={NavLink} to="/architecture" className="fw-medium">
              <i className="bi bi-diagram-3 me-1"></i> Architecture
            </Nav.Link>

            {isAuthenticated ? (
              <div className="d-flex align-items-center gap-2 ms-lg-3 border-start ps-lg-3 mt-2 mt-lg-0">
                <div className="d-flex flex-column text-end small">
                  <span className="fw-bold text-dark">{user?.name}</span>
                  <Badge bg={getRoleBadgeVariant(user?.role)} className="text-uppercase fw-semibold" style={{ fontSize: '0.65rem' }}>
                    {user?.role}
                  </Badge>
                </div>
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={handleLogout}
                  className="d-flex align-items-center gap-1 ms-1"
                >
                  <i className="bi bi-box-arrow-right"></i>
                  Sign Out
                </Button>
              </div>
            ) : (
              <Button
                as={Link}
                to="/login"
                variant="primary"
                size="sm"
                className="ms-lg-3 d-flex align-items-center gap-1"
              >
                <i className="bi bi-box-arrow-in-right"></i>
                Sign In
              </Button>
            )}
          </Nav>
        </BsNavbar.Collapse>
      </Container>
    </BsNavbar>
  );
};

export default Navbar;
