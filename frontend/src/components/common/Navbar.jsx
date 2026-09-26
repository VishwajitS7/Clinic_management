import React from 'react';
import { Navbar as BsNavbar, Container, Nav, Badge } from 'react-bootstrap';
import { Link, NavLink } from 'react-router-dom';

const Navbar = () => {
  return (
    <BsNavbar bg="white" expand="lg" className="border-bottom sticky-top py-2 shadow-sm">
      <Container>
        <BsNavbar.Brand as={Link} to="/" className="d-flex align-items-center gap-2 fw-bold text-primary">
          <i className="bi bi-hospital fs-4 text-primary"></i>
          <span>Clinic Appointment Manager</span>
          <Badge bg="primary" pill className="ms-2 small fw-normal">
            v1.0
          </Badge>
        </BsNavbar.Brand>
        <BsNavbar.Toggle aria-controls="main-navbar-nav" />
        <BsNavbar.Collapse id="main-navbar-nav">
          <Nav className="ms-auto align-items-center gap-2">
            <Nav.Link as={NavLink} to="/" end className="fw-medium">
              <i className="bi bi-activity me-1"></i> System Health
            </Nav.Link>
            <Nav.Link as={NavLink} to="/architecture" className="fw-medium">
              <i className="bi bi-diagram-3 me-1"></i> Architecture
            </Nav.Link>
          </Nav>
        </BsNavbar.Collapse>
      </Container>
    </BsNavbar>
  );
};

export default Navbar;
