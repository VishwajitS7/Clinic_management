import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Badge } from 'react-bootstrap';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, isAuthenticated, authError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectPath = location.state?.from?.pathname || '/dashboard';

  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, navigate, redirectPath]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!email || !password) {
      setFormError('Please enter both email and password.');
      return;
    }

    setIsSubmitting(true);
    const result = await login(email, password);
    setIsSubmitting(false);

    if (result.success) {
      navigate(redirectPath, { replace: true });
    }
  };

  const handleDemoFill = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setFormError('');
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8} lg={5}>
          <div className="text-center mb-4">
            <div className="d-inline-flex align-items-center justify-content-center bg-primary-subtle text-primary rounded-circle p-3 mb-2">
              <i className="bi bi-hospital fs-1"></i>
            </div>
            <h3 className="fw-bold mb-1">Clinic Appointment Manager</h3>
            <p className="text-muted small">Sign in to your authorized portal</p>
          </div>

          <Card className="clinic-card border-0 shadow-sm mb-4">
            <Card.Body className="p-4">
              {(formError || authError) && (
                <Alert variant="danger" className="py-2 small">
                  <i className="bi bi-exclamation-circle me-1"></i>
                  {formError || authError}
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="loginEmail">
                  <Form.Label className="small fw-semibold text-muted">Email Address</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="name@clinic.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </Form.Group>

                <Form.Group className="mb-4" controlId="loginPassword">
                  <Form.Label className="small fw-semibold text-muted">Password</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </Form.Group>

                <Button
                  variant="primary"
                  type="submit"
                  className="w-100 py-2 fw-semibold d-flex align-items-center justify-content-center gap-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      Authenticating...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-box-arrow-in-right"></i>
                      Sign In
                    </>
                  )}
                </Button>
              </Form>
            </Card.Body>
          </Card>

          {/* Quick One-Click Demo Credentials */}
          <Card className="clinic-card border-0 bg-light shadow-sm">
            <Card.Body className="p-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="small fw-bold text-muted">QUICK DEMO CREDENTIALS</span>
                <Badge bg="secondary">Interview Helper</Badge>
              </div>
              <div className="d-grid gap-2">
                <Button
                  variant="outline-primary"
                  size="sm"
                  className="text-start d-flex justify-content-between align-items-center"
                  onClick={() => handleDemoFill('admin@clinic.com', 'Admin@123')}
                >
                  <span>
                    <strong>Admin:</strong> admin@clinic.com
                  </span>
                  <Badge bg="primary">Admin@123</Badge>
                </Button>

                <Button
                  variant="outline-success"
                  size="sm"
                  className="text-start d-flex justify-content-between align-items-center"
                  onClick={() => handleDemoFill('dr.rahul@clinic.com', 'Doctor@123')}
                >
                  <span>
                    <strong>Doctor:</strong> dr.rahul@clinic.com
                  </span>
                  <Badge bg="success">Doctor@123</Badge>
                </Button>

                <Button
                  variant="outline-info"
                  size="sm"
                  className="text-start d-flex justify-content-between align-items-center"
                  onClick={() => handleDemoFill('receptionist@clinic.com', 'Recep@123')}
                >
                  <span>
                    <strong>Receptionist:</strong> receptionist@clinic.com
                  </span>
                  <Badge bg="info">Recep@123</Badge>
                </Button>
              </div>
            </Card.Body>
          </Card>

          <div className="text-center mt-3">
            <Link to="/" className="text-decoration-none small text-muted">
              &larr; Back to System Health Check
            </Link>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default LoginPage;
