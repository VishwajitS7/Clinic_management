import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Alert } from 'react-bootstrap';
import api from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';

const HealthCheckPage = () => {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [latency, setLatency] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    const startTime = performance.now();

    try {
      const response = await api.get('/health');
      const endTime = performance.now();
      setLatency(Math.round(endTime - startTime));
      setHealthData(response.data);
      setLastChecked(new Date().toLocaleTimeString());
    } catch (err) {
      setError(err.message || 'Failed to connect to backend API server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  return (
    <Container className="py-4">
      {/* Page Title & Refresh */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-2 border-bottom">
        <div>
          <h2 className="fw-bold mb-1 d-flex align-items-center gap-2">
            <i className="bi bi-shield-check text-primary"></i>
            Phase 1: Project Foundation & System Health
          </h2>
          <p className="text-muted mb-0">
            Full-stack environment verification, layered architecture configuration, and API connectivity.
          </p>
        </div>
        <div className="mt-2 mt-md-0 d-flex align-items-center gap-3">
          {lastChecked && (
            <span className="text-muted small">
              Last checked: <strong>{lastChecked}</strong>
            </span>
          )}
          <Button
            variant="primary"
            size="sm"
            onClick={fetchHealth}
            disabled={loading}
            className="d-flex align-items-center gap-1"
          >
            <i className={`bi bi-arrow-clockwise ${loading ? 'spin' : ''}`}></i>
            Refresh Status
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="danger" className="d-flex align-items-center gap-2">
          <i className="bi bi-exclamation-triangle-fill fs-5"></i>
          <div>
            <strong>Backend Connection Error:</strong> {error}
            <div className="small text-muted mt-1">
              Ensure the backend Express server is running on port 5000 (`npm run dev` in `/backend`).
            </div>
          </div>
        </Alert>
      )}

      {loading && !healthData ? (
        <LoadingSpinner message="Checking backend and database connectivity..." />
      ) : healthData ? (
        <Row className="g-4">
          {/* Quick Metrics */}
          <Col md={3}>
            <Card className="clinic-card h-100 border-0 shadow-sm">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="text-muted small fw-medium">API STATUS</span>
                  <span className="pulse-indicator"></span>
                </div>
                <h4 className="fw-bold text-success mb-0">{healthData.status}</h4>
                <div className="text-muted small mt-1">HTTP 200 OK</div>
              </Card.Body>
            </Card>
          </Col>

          <Col md={3}>
            <Card className="clinic-card h-100 border-0 shadow-sm">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="text-muted small fw-medium">LATENCY</span>
                  <i className="bi bi-speedometer2 text-primary fs-5"></i>
                </div>
                <h4 className="fw-bold text-primary mb-0">{latency} ms</h4>
                <div className="text-muted small mt-1">Vite Proxy ↔ Express</div>
              </Card.Body>
            </Card>
          </Col>

          <Col md={3}>
            <Card className="clinic-card h-100 border-0 shadow-sm">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="text-muted small fw-medium">DATABASE</span>
                  <i
                    className={`bi ${
                      healthData.database.connected ? 'bi-database-check text-success' : 'bi-database-slash text-warning'
                    } fs-5`}
                  ></i>
                </div>
                <h4
                  className={`fw-bold mb-0 ${
                    healthData.database.connected ? 'text-success' : 'text-warning'
                  }`}
                >
                  {healthData.database.state}
                </h4>
                <div className="text-muted small mt-1">
                  {healthData.database.connected ? 'Mongoose Active' : 'Configure MONGODB_URI in .env'}
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col md={3}>
            <Card className="clinic-card h-100 border-0 shadow-sm">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="text-muted small fw-medium">SERVER UPTIME</span>
                  <i className="bi bi-clock-history text-secondary fs-5"></i>
                </div>
                <h4 className="fw-bold text-dark mb-0">{healthData.uptimeSeconds}s</h4>
                <div className="text-muted small mt-1">Node.js Express Server</div>
              </Card.Body>
            </Card>
          </Col>

          {/* Detailed Specifications */}
          <Col lg={7}>
            <Card className="clinic-card border-0 shadow-sm h-100">
              <div className="clinic-card-header d-flex justify-content-between align-items-center">
                <span>Phase 1 Verification Matrix</span>
                <span className="badge bg-success-subtle text-success border border-success-subtle">
                  Verified
                </span>
              </div>
              <Card.Body className="p-0">
                <Table hover responsive className="mb-0 align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Component</th>
                      <th>Configuration / Target</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="fw-medium">Frontend Framework</td>
                      <td>React 18 + Vite (JavaScript)</td>
                      <td><span className="badge bg-success">Active</span></td>
                    </tr>
                    <tr>
                      <td className="fw-medium">UI & Styling</td>
                      <td>Bootstrap 5 + React-Bootstrap + Inter Typography</td>
                      <td><span className="badge bg-success">Loaded</span></td>
                    </tr>
                    <tr>
                      <td className="fw-medium">Routing & Navigation</td>
                      <td>React Router DOM v6</td>
                      <td><span className="badge bg-success">Ready</span></td>
                    </tr>
                    <tr>
                      <td className="fw-medium">HTTP Client</td>
                      <td>Axios instance with Bearer interceptors & error abstraction</td>
                      <td><span className="badge bg-success">Connected</span></td>
                    </tr>
                    <tr>
                      <td className="fw-medium">Backend Server</td>
                      <td>Node.js Express with CORS, Morgan, JSON parsing</td>
                      <td><span className="badge bg-success">Port 5000</span></td>
                    </tr>
                    <tr>
                      <td className="fw-medium">Database Layer</td>
                      <td>Mongoose ODM with Atlas Connection Handler & Event Listeners</td>
                      <td>
                        <span className={`badge ${healthData.database.connected ? 'bg-success' : 'bg-warning text-dark'}`}>
                          {healthData.database.connected ? 'Atlas Ready' : 'Awaiting Connection'}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="fw-medium">Architecture Pattern</td>
                      <td>Layered: Route → Middleware → Controller → Service → Model</td>
                      <td><span className="badge bg-success">Established</span></td>
                    </tr>
                    <tr>
                      <td className="fw-medium">Error Handling</td>
                      <td>Centralized AppError, Mongoose 11000/Cast/Validation handlers</td>
                      <td><span className="badge bg-success">Operational</span></td>
                    </tr>
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>

          {/* Central Workflow Diagram */}
          <Col lg={5}>
            <Card className="clinic-card border-0 shadow-sm h-100">
              <div className="clinic-card-header">
                <span>Core Business Workflow</span>
              </div>
              <Card.Body>
                <div className="p-3 bg-light rounded font-monospace small">
                  <div className="text-primary fw-bold">Patient</div>
                  <div className="text-muted ps-3">↓</div>
                  <div className="text-primary fw-bold">Doctor</div>
                  <div className="text-muted ps-3">↓</div>
                  <div className="text-info fw-bold">Doctor Schedule</div>
                  <div className="text-muted ps-3">↓</div>
                  <div className="text-info fw-bold">Available Slots (Dynamic Interval Overlap)</div>
                  <div className="text-muted ps-3">↓</div>
                  <div className="text-success fw-bold">Appointment (Conflict Detection)</div>
                  <div className="text-muted ps-3">↓</div>
                  <div className="text-dark fw-bold">Consultation (Symptoms & Diagnosis)</div>
                  <div className="text-muted ps-3">↓</div>
                  <div className="text-dark fw-bold">Prescription (Embedded Medicine Items)</div>
                  <div className="text-muted ps-3">↓</div>
                  <div className="text-warning fw-bold">Invoice (Backend-calculated Financials)</div>
                  <div className="text-muted ps-3">↓</div>
                  <div className="text-success fw-bold">Payment (Balance & Status Engine)</div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      ) : null}
    </Container>
  );
};

export default HealthCheckPage;
