import React, { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Badge,
  Alert,
  Button,
  Spinner,
  Table,
  ProgressBar,
} from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import dashboardService from '../services/dashboardService';
import StatusBadge from '../components/common/StatusBadge';

const DashboardPage = () => {
  const { user, doctor } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const res = await dashboardService.getStats();
        setStats(res.data);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
        setError(err.response?.data?.message || 'Failed to fetch dashboard intelligence');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const metrics = stats?.metrics || {};
  const statusBreakdown = stats?.statusBreakdown || {};

  return (
    <Container className="py-4">
      {/* Welcome Banner */}
      <Card className="border-0 shadow-sm mb-4 bg-primary text-white p-4">
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
              Real-time clinical intelligence, interval scheduling engine, and billing operations.
            </p>
          </Col>
          <Col md={4} className="text-md-end mt-3 mt-md-0">
            <div className="bg-white text-dark p-3 rounded shadow-sm d-inline-block text-start">
              <div className="small text-muted fw-semibold">SESSION DETAILS</div>
              <div className="fw-bold">{user?.email}</div>
              <div className="small text-muted">ID: {user?._id?.slice(-8)} &bull; Active</div>
            </div>
          </Col>
        </Row>
      </Card>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)} className="py-2 small">
          <i className="bi bi-exclamation-triangle me-1"></i> {error}
        </Alert>
      )}

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <div className="text-muted small mt-2">Computing clinic analytics...</div>
        </div>
      ) : (
        <>
          {/* Key KPI Cards */}
          <Row className="g-3 mb-4">
            {user?.role === 'DOCTOR' ? (
              <>
                <Col xs={6} md={3}>
                  <Card className="border-0 shadow-sm p-3 h-100 border-start border-4 border-primary">
                    <div className="text-muted small fw-semibold text-uppercase">Today's Queue</div>
                    <div className="h3 fw-bold text-primary mb-0 mt-1">
                      {metrics.todayAppointments ?? 0}
                    </div>
                    <div className="small text-muted">Active patients today</div>
                  </Card>
                </Col>
                <Col xs={6} md={3}>
                  <Card className="border-0 shadow-sm p-3 h-100 border-start border-4 border-info">
                    <div className="text-muted small fw-semibold text-uppercase">Total Encounters</div>
                    <div className="h3 fw-bold text-info mb-0 mt-1">
                      {metrics.totalAppointments ?? 0}
                    </div>
                    <div className="small text-muted">Total booked slots</div>
                  </Card>
                </Col>
                <Col xs={6} md={3}>
                  <Card className="border-0 shadow-sm p-3 h-100 border-start border-4 border-success">
                    <div className="text-muted small fw-semibold text-uppercase">Consultations</div>
                    <div className="h3 fw-bold text-success mb-0 mt-1">
                      {metrics.completedConsultations ?? 0}
                    </div>
                    <div className="small text-muted">Completed diagnostic visits</div>
                  </Card>
                </Col>
                <Col xs={6} md={3}>
                  <Card className="border-0 shadow-sm p-3 h-100 border-start border-4 border-warning">
                    <div className="text-muted small fw-semibold text-uppercase">Rx Prescribed</div>
                    <div className="h3 fw-bold text-warning-emphasis mb-0 mt-1">
                      {metrics.prescriptionsIssued ?? 0}
                    </div>
                    <div className="small text-muted">Medical prescriptions</div>
                  </Card>
                </Col>
              </>
            ) : (
              <>
                <Col xs={6} md={3}>
                  <Card className="border-0 shadow-sm p-3 h-100 border-start border-4 border-primary">
                    <div className="text-muted small fw-semibold text-uppercase">Active Patients</div>
                    <div className="h3 fw-bold text-primary mb-0 mt-1">
                      {metrics.totalPatients ?? 0}
                    </div>
                    <div className="small text-muted">Registered in clinic</div>
                  </Card>
                </Col>
                <Col xs={6} md={3}>
                  <Card className="border-0 shadow-sm p-3 h-100 border-start border-4 border-info">
                    <div className="text-muted small fw-semibold text-uppercase">Today's Visits</div>
                    <div className="h3 fw-bold text-info mb-0 mt-1">
                      {metrics.todayAppointments ?? 0}
                    </div>
                    <div className="small text-muted">Scheduled today</div>
                  </Card>
                </Col>
                <Col xs={6} md={3}>
                  <Card className="border-0 shadow-sm p-3 h-100 border-start border-4 border-success">
                    <div className="text-muted small fw-semibold text-uppercase">Collected Revenue</div>
                    <div className="h3 fw-bold text-success font-monospace mb-0 mt-1">
                      ₹{(metrics.totalRevenue || 0).toLocaleString()}
                    </div>
                    <div className="small text-muted">Receipts cleared</div>
                  </Card>
                </Col>
                <Col xs={6} md={3}>
                  <Card className="border-0 shadow-sm p-3 h-100 border-start border-4 border-danger">
                    <div className="text-muted small fw-semibold text-uppercase">Outstanding Dues</div>
                    <div className="h3 fw-bold text-danger font-monospace mb-0 mt-1">
                      ₹{(metrics.totalOutstandingDue || 0).toLocaleString()}
                    </div>
                    <div className="small text-muted">Pending balance</div>
                  </Card>
                </Col>
              </>
            )}
          </Row>

          {/* Appointment Status Distribution Bar */}
          <Card className="border-0 shadow-sm mb-4 p-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="small fw-semibold text-muted text-uppercase">
                Appointment Lifecycle Distribution
              </span>
              <div className="d-flex gap-3 small">
                <span><Badge bg="info">Scheduled: {statusBreakdown.SCHEDULED || 0}</Badge></span>
                <span><Badge bg="primary">Confirmed: {statusBreakdown.CONFIRMED || 0}</Badge></span>
                <span><Badge bg="success">Completed: {statusBreakdown.COMPLETED || 0}</Badge></span>
                <span><Badge bg="danger">Cancelled: {statusBreakdown.CANCELLED || 0}</Badge></span>
              </div>
            </div>
            <ProgressBar style={{ height: '10px' }}>
              <ProgressBar variant="info" now={(statusBreakdown.SCHEDULED || 0) * 10} key={1} />
              <ProgressBar variant="primary" now={(statusBreakdown.CONFIRMED || 0) * 10} key={2} />
              <ProgressBar variant="success" now={(statusBreakdown.COMPLETED || 0) * 10} key={3} />
              <ProgressBar variant="danger" now={(statusBreakdown.CANCELLED || 0) * 10} key={4} />
            </ProgressBar>
          </Card>

          {/* Role Quick Links / Navigation Directory */}
          <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
            <i className="bi bi-grid-fill text-primary"></i> Operations & Clinical Directory
          </h5>
          <Row className="g-3 mb-4">
            <Col xs={6} md={user?.role === 'ADMIN' ? 2 : user?.role === 'DOCTOR' ? 3 : 2}>
              <Card
                as={Link}
                to="/patients"
                className="border-0 shadow-sm text-center p-3 h-100 text-decoration-none bg-white hover-shadow"
              >
                <i className="bi bi-people fs-2 text-primary mb-2"></i>
                <h6 className="fw-bold mb-1 text-dark">
                  {user?.role === 'DOCTOR' ? 'Patient Dossiers' : 'Patients'}
                </h6>
                <p className="text-muted small mb-0">
                  {user?.role === 'DOCTOR' ? 'Clinical Histories' : 'Records & Intake'}
                </p>
              </Card>
            </Col>

            {user?.role !== 'DOCTOR' && (
              <Col xs={6} md={2}>
                <Card
                  as={Link}
                  to="/doctors"
                  className="border-0 shadow-sm text-center p-3 h-100 text-decoration-none bg-white hover-shadow"
                >
                  <i className="bi bi-person-badge fs-2 text-success mb-2"></i>
                  <h6 className="fw-bold mb-1 text-dark">Doctors</h6>
                  <p className="text-muted small mb-0">Specialist Directory</p>
                </Card>
              </Col>
            )}

            <Col xs={6} md={user?.role === 'ADMIN' ? 2 : user?.role === 'DOCTOR' ? 2 : 2}>
              <Card
                as={Link}
                to="/schedules"
                className="border-0 shadow-sm text-center p-3 h-100 text-decoration-none bg-white hover-shadow"
              >
                <i className="bi bi-calendar-range fs-2 text-info mb-2"></i>
                <h6 className="fw-bold mb-1 text-dark">Schedules</h6>
                <p className="text-muted small mb-0">
                  {user?.role === 'DOCTOR' ? 'My Shifts & Timings' : 'Weekly Rosters'}
                </p>
              </Card>
            </Col>

            <Col xs={6} md={user?.role === 'ADMIN' ? 2 : user?.role === 'DOCTOR' ? 3 : 2}>
              <Card
                as={Link}
                to="/appointments"
                className="border-0 shadow-sm text-center p-3 h-100 text-decoration-none bg-white hover-shadow"
              >
                <i className="bi bi-calendar-check fs-2 text-warning mb-2"></i>
                <h6 className="fw-bold mb-1 text-dark">Appointments</h6>
                <p className="text-muted small mb-0">
                  {user?.role === 'DOCTOR' ? 'Patient Queue' : 'Booking Engine'}
                </p>
              </Card>
            </Col>

            {user?.role !== 'RECEPTIONIST' && (
              <Col xs={6} md={user?.role === 'ADMIN' ? 2 : 2}>
                <Card
                  as={Link}
                  to="/consultations"
                  className="border-0 shadow-sm text-center p-3 h-100 text-decoration-none bg-white hover-shadow"
                >
                  <i className="bi bi-clipboard2-pulse fs-2 text-danger mb-2"></i>
                  <h6 className="fw-bold mb-1 text-dark">Consultations</h6>
                  <p className="text-muted small mb-0">Diagnoses & Notes</p>
                </Card>
              </Col>
            )}

            <Col xs={6} md={user?.role === 'ADMIN' ? 2 : 2}>
              <Card
                as={Link}
                to="/prescriptions"
                className="border-0 shadow-sm text-center p-3 h-100 text-decoration-none bg-white hover-shadow"
              >
                <i className="bi bi-capsule fs-2 text-info mb-2"></i>
                <h6 className="fw-bold mb-1 text-dark">Prescriptions</h6>
                <p className="text-muted small mb-0">
                  {user?.role === 'DOCTOR' ? 'Write Medical Rx' : 'Print & Checkout'}
                </p>
              </Card>
            </Col>

            {user?.role !== 'DOCTOR' && (
              <Col xs={6} md={2}>
                <Card
                  as={Link}
                  to="/invoices"
                  className="border-0 shadow-sm text-center p-3 h-100 text-decoration-none bg-white hover-shadow"
                >
                  <i className="bi bi-receipt-cutoff fs-2 text-secondary mb-2"></i>
                  <h6 className="fw-bold mb-1 text-dark">Billing</h6>
                  <p className="text-muted small mb-0">Cashier & Invoices</p>
                </Card>
              </Col>
            )}
          </Row>

          {/* Recent Operational / Clinical Activity */}
          <Row className="g-4">
            <Col md={7}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Header className="bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
                  <span className="fw-bold">
                    <i className="bi bi-clock-history me-2 text-primary"></i>
                    {user?.role === 'DOCTOR' ? 'My Upcoming Appointments' : 'Recent Appointments'}
                  </span>
                  <Button
                    as={Link}
                    to="/appointments"
                    variant="outline-primary"
                    size="sm"
                    className="small"
                  >
                    View All
                  </Button>
                </Card.Header>
                <div className="table-responsive">
                  <Table hover size="sm" align="middle" className="mb-0">
                    <thead className="table-light small text-muted text-uppercase">
                      <tr>
                        <th>Code</th>
                        <th>Patient</th>
                        <th>Date & Time</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(stats?.recentAppointments || stats?.upcomingAppointments || []).map((apt) => (
                        <tr key={apt._id}>
                          <td className="font-monospace text-primary fw-semibold small">
                            {apt.appointmentCode}
                          </td>
                          <td className="fw-medium small">
                            {apt.patient?.name || (apt.patient?.firstName ? `${apt.patient.firstName} ${apt.patient.lastName || ''}`.trim() : 'N/A')}
                          </td>
                          <td className="small text-muted">
                            {new Date(apt.appointmentDate).toLocaleDateString()} ({apt.startTime})
                          </td>
                          <td>
                            <StatusBadge status={apt.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </Card>
            </Col>

            {/* Doctor View: Recent Consultations; Admin/Receptionist View: Recent Invoices */}
            <Col md={5}>
              <Card className="border-0 shadow-sm h-100">
                {user?.role === 'DOCTOR' ? (
                  <>
                    <Card.Header className="bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
                      <span className="fw-bold">
                        <i className="bi bi-clipboard2-pulse me-2 text-danger"></i>
                        Recent Consultations
                      </span>
                      <Button
                        as={Link}
                        to="/consultations"
                        variant="outline-danger"
                        size="sm"
                        className="small"
                      >
                        View All
                      </Button>
                    </Card.Header>
                    <div className="table-responsive">
                      <Table hover size="sm" align="middle" className="mb-0">
                        <thead className="table-light small text-muted text-uppercase">
                          <tr>
                            <th>Patient</th>
                            <th>Diagnosis</th>
                            <th>Encounter Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(stats?.recentConsultations || []).length === 0 ? (
                            <tr>
                              <td colSpan="3" className="text-center text-muted py-3 small">
                                No consultations recorded yet.
                              </td>
                            </tr>
                          ) : (
                            (stats?.recentConsultations || []).map((c) => (
                              <tr key={c._id}>
                                <td className="fw-medium small">
                                  {c.patient?.name || (c.patient?.firstName ? `${c.patient.firstName} ${c.patient.lastName || ''}`.trim() : 'Patient')}
                                </td>
                                <td className="small text-dark font-monospace text-truncate" style={{ maxWidth: '140px' }}>
                                  {c.diagnosis}
                                </td>
                                <td className="small text-muted">
                                  {new Date(c.createdAt).toLocaleDateString()}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </Table>
                    </div>
                  </>
                ) : (
                  <>
                    <Card.Header className="bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
                      <span className="fw-bold">
                        <i className="bi bi-cash-stack me-2 text-success"></i>
                        Recent Invoices
                      </span>
                      <Button
                        as={Link}
                        to="/invoices"
                        variant="outline-success"
                        size="sm"
                        className="small"
                      >
                        View All
                      </Button>
                    </Card.Header>
                    <div className="table-responsive">
                      <Table hover size="sm" align="middle" className="mb-0">
                        <thead className="table-light small text-muted text-uppercase">
                          <tr>
                            <th>Invoice #</th>
                            <th>Patient</th>
                            <th>Amount</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(stats?.recentInvoices || []).map((inv) => (
                            <tr key={inv._id}>
                              <td className="font-monospace text-primary fw-semibold small">
                                {inv.invoiceNumber}
                              </td>
                              <td className="fw-medium small">
                                {inv.patient?.name || (inv.patient?.firstName ? `${inv.patient.firstName} ${inv.patient.lastName || ''}`.trim() : 'N/A')}
                              </td>
                              <td className="font-monospace fw-bold small">
                                ₹{inv.totalAmount?.toFixed(2)}
                              </td>
                              <td>
                                <StatusBadge status={inv.status} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  </>
                )}
              </Card>
            </Col>
          </Row>
        </>
      )}
    </Container>
  );
};

export default DashboardPage;
