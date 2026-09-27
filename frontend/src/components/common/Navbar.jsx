import React, { useState } from 'react';
import { Navbar as BsNavbar, Container, Nav, NavDropdown, Badge, Button } from 'react-bootstrap';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [expanded, setExpanded] = useState(false);

  const handleLogout = async () => {
    setExpanded(false);
    await logout();
    navigate('/login');
  };

  const closeNav = () => setExpanded(false);

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

  // Check if clinical routes are active
  const isClinicalActive =
    location.pathname.startsWith('/consultations') ||
    location.pathname.startsWith('/prescriptions');

  // Check if doctor/schedule routes are active
  const isDoctorActive =
    location.pathname.startsWith('/doctors') ||
    location.pathname.startsWith('/schedules');

  // Check if system routes are active
  const isSystemActive =
    location.pathname === '/' ||
    location.pathname === '/architecture';

  return (
    <BsNavbar
      bg="white"
      expand="xl"
      expanded={expanded}
      className="border-bottom sticky-top py-2 shadow-sm clinic-navbar"
      style={{ backdropFilter: 'blur(10px)', backgroundColor: 'rgba(255, 255, 255, 0.95)' }}
    >
      <Container fluid="xl">
        {/* Brand */}
        <BsNavbar.Brand
          as={Link}
          to={isAuthenticated ? '/dashboard' : '/'}
          onClick={closeNav}
          className="d-flex align-items-center gap-2 fw-bold text-primary py-0 me-3"
        >
          <div className="brand-icon-wrapper rounded-3 bg-primary text-white d-flex align-items-center justify-content-center p-2 shadow-sm">
            <i className="bi bi-hospital fs-5"></i>
          </div>
          <div className="d-flex flex-column">
            <span className="fs-6 fw-bold lh-1 text-dark">Clinic Management</span>
            <span className="small text-muted" style={{ fontSize: '0.7rem' }}>
              Healthcare Platform <Badge bg="primary-subtle" text="primary" className="ms-1 px-1">v1.0</Badge>
            </span>
          </div>
        </BsNavbar.Brand>

        {/* Mobile Toggle */}
        <BsNavbar.Toggle
          aria-controls="main-navbar-nav"
          onClick={() => setExpanded(!expanded)}
          className="border-0 shadow-none p-1"
        >
          <i className={`bi ${expanded ? 'bi-x-lg' : 'bi-list'} fs-4 text-primary`}></i>
        </BsNavbar.Toggle>

        {/* Collapsible Content */}
        <BsNavbar.Collapse id="main-navbar-nav">
          <Nav className="me-auto align-items-xl-center gap-1 my-2 my-xl-0">
            {isAuthenticated ? (
              <>
                <Nav.Link
                  as={NavLink}
                  to="/dashboard"
                  onClick={closeNav}
                  className="nav-item-custom"
                >
                  <i className="bi bi-speedometer2 me-1 text-primary"></i> Dashboard
                </Nav.Link>

                <Nav.Link
                  as={NavLink}
                  to="/appointments"
                  onClick={closeNav}
                  className="nav-item-custom"
                >
                  <i className="bi bi-calendar-check me-1 text-warning"></i>
                  {user?.role === 'DOCTOR' ? 'My Appointments' : 'Appointments'}
                </Nav.Link>

                <Nav.Link
                  as={NavLink}
                  to="/patients"
                  onClick={closeNav}
                  className="nav-item-custom"
                >
                  <i className="bi bi-people me-1 text-info"></i>
                  {user?.role === 'DOCTOR' ? 'Patient Dossiers' : 'Patients'}
                </Nav.Link>

                {/* Doctor Schedules or Specialist Directory */}
                {user?.role === 'DOCTOR' ? (
                  <Nav.Link
                    as={NavLink}
                    to="/schedules"
                    onClick={closeNav}
                    className="nav-item-custom"
                  >
                    <i className="bi bi-calendar-range me-1 text-success"></i> My Schedules
                  </Nav.Link>
                ) : (
                  <NavDropdown
                    title={
                      <span className={isDoctorActive ? 'fw-bold text-primary' : ''}>
                        <i className="bi bi-person-badge me-1 text-success"></i> Doctors
                      </span>
                    }
                    id="doctors-nav-dropdown"
                    className="nav-dropdown-custom"
                  >
                    <NavDropdown.Item as={NavLink} to="/doctors" onClick={closeNav}>
                      <i className="bi bi-person-lines-fill me-2 text-primary"></i>
                      Specialist Directory
                    </NavDropdown.Item>
                    <NavDropdown.Item as={NavLink} to="/schedules" onClick={closeNav}>
                      <i className="bi bi-calendar-range me-2 text-success"></i>
                      Weekly Schedules & Rosters
                    </NavDropdown.Item>
                  </NavDropdown>
                )}

                {/* Clinical Consultations & Prescriptions */}
                {user?.role === 'RECEPTIONIST' ? (
                  <Nav.Link
                    as={NavLink}
                    to="/prescriptions"
                    onClick={closeNav}
                    className="nav-item-custom"
                  >
                    <i className="bi bi-capsule me-1 text-info"></i> Prescriptions (Rx)
                  </Nav.Link>
                ) : (
                  <NavDropdown
                    title={
                      <span className={isClinicalActive ? 'fw-bold text-primary' : ''}>
                        <i className="bi bi-clipboard2-pulse me-1 text-danger"></i> Clinical
                      </span>
                    }
                    id="clinical-nav-dropdown"
                    className="nav-dropdown-custom"
                  >
                    <NavDropdown.Item as={NavLink} to="/consultations" onClick={closeNav}>
                      <i className="bi bi-journal-medical me-2 text-danger"></i>
                      Consultations & Diagnosis
                    </NavDropdown.Item>
                    <NavDropdown.Item as={NavLink} to="/prescriptions" onClick={closeNav}>
                      <i className="bi bi-capsule me-2 text-info"></i>
                      Prescriptions (Rx)
                    </NavDropdown.Item>
                  </NavDropdown>
                )}

                {/* Billing: Strictly for Admin & Receptionist (Cashier Desk) */}
                {user?.role !== 'DOCTOR' && (
                  <Nav.Link
                    as={NavLink}
                    to="/invoices"
                    onClick={closeNav}
                    className="nav-item-custom"
                  >
                    <i className="bi bi-receipt-cutoff me-1 text-secondary"></i> Billing & Payments
                  </Nav.Link>
                )}
              </>
            ) : null}

            {/* System Info Dropdown */}
            <NavDropdown
              title={
                <span className={isSystemActive ? 'fw-bold text-primary' : 'text-muted'}>
                  <i className="bi bi-gear me-1"></i> System
                </span>
              }
              id="system-nav-dropdown"
              className="nav-dropdown-custom"
            >
              <NavDropdown.Item as={NavLink} to="/" onClick={closeNav} end>
                <i className="bi bi-activity me-2 text-success"></i>
                System Health & Uptime
              </NavDropdown.Item>
              <NavDropdown.Item as={NavLink} to="/architecture" onClick={closeNav}>
                <i className="bi bi-diagram-3 me-2 text-primary"></i>
                Architecture & Models
              </NavDropdown.Item>
              <NavDropdown.Item href="/demo.html" target="_blank" rel="noopener noreferrer" onClick={closeNav}>
                <i className="bi bi-stars me-2 text-warning"></i>
                Feature & RBAC Showcase
              </NavDropdown.Item>
            </NavDropdown>
          </Nav>

          {/* User Auth Profile / Login */}
          <Nav className="align-items-xl-center">
            {isAuthenticated ? (
              <div className="d-flex flex-column flex-xl-row align-items-xl-center gap-2 pt-2 pt-xl-0 border-top border-xl-0 mt-2 mt-xl-0">
                <div className="d-flex align-items-center gap-2 px-2 py-1 rounded bg-light border">
                  <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold" style={{ width: '28px', height: '28px', fontSize: '0.75rem' }}>
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="d-flex flex-column text-start">
                    <span className="fw-semibold text-dark text-truncate small" style={{ maxWidth: '140px', lineHeight: '1.2' }}>
                      {user?.name}
                    </span>
                    <Badge
                      bg={getRoleBadgeVariant(user?.role)}
                      className="text-uppercase fw-normal"
                      style={{ fontSize: '0.62rem', width: 'fit-content' }}
                    >
                      {user?.role}
                    </Badge>
                  </div>
                </div>

                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={handleLogout}
                  className="d-flex align-items-center justify-content-center gap-1 mt-1 mt-xl-0 py-1 px-2"
                >
                  <i className="bi bi-box-arrow-right"></i>
                  <span>Sign Out</span>
                </Button>
              </div>
            ) : (
              <div className="d-flex align-items-center gap-2 mt-2 mt-xl-0">
                <Button
                  as={Link}
                  to="/login"
                  variant="outline-primary"
                  size="sm"
                  onClick={closeNav}
                  className="d-flex align-items-center justify-content-center gap-1 px-3"
                >
                  <i className="bi bi-box-arrow-in-right"></i>
                  <span>Sign In</span>
                </Button>
                <Button
                  as={Link}
                  to="/register"
                  variant="primary"
                  size="sm"
                  onClick={closeNav}
                  className="d-flex align-items-center justify-content-center gap-1 px-3 shadow-sm"
                >
                  <i className="bi bi-person-plus"></i>
                  <span>Register</span>
                </Button>
              </div>
            )}
          </Nav>
        </BsNavbar.Collapse>
      </Container>
    </BsNavbar>
  );
};

export default Navbar;
