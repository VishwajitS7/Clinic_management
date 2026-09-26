import React from 'react';
import { Container, Alert, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RoleGuard = ({ roles = [], children }) => {
  const { user } = useAuth();

  if (!user || (roles.length > 0 && !roles.includes(user.role))) {
    return (
      <Container className="py-5">
        <Alert variant="danger" className="text-center p-4">
          <i className="bi bi-shield-x display-4 text-danger mb-3 d-block"></i>
          <h4 className="alert-heading fw-bold">403 — Unauthorized Access</h4>
          <p className="text-muted">
            Your role <strong>({user?.role || 'Guest'})</strong> does not have permission to view this section.
          </p>
          <div className="mt-3">
            <Button as={Link} to="/dashboard" variant="primary" size="sm">
              Return to Dashboard
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }

  return children;
};

export default RoleGuard;
