import React, { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Badge,
  Tabs,
  Tab,
  Table,
  Button,
  Alert,
} from 'react-bootstrap';
import { useParams, Link } from 'react-router-dom';
import { getPatientById } from '../services/patientService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatusBadge from '../components/common/StatusBadge';

const PatientDetailsPage = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('appointments');

  useEffect(() => {
    const fetchPatientDossier = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getPatientById(id);
        if (response.success) {
          setData(response.data);
        }
      } catch (err) {
        setError(err.message || 'Failed to retrieve patient dossier');
      } finally {
        setLoading(false);
      }
    };

    fetchPatientDossier();
  }, [id]);

  if (loading) {
    return <LoadingSpinner message="Retrieving comprehensive patient clinical dossier..." className="py-5" />;
  }

  if (error || !data) {
    return (
      <Container className="py-5">
        <Alert variant="danger" className="text-center p-4">
          <i className="bi bi-exclamation-octagon display-4 text-danger mb-3 d-block"></i>
          <h4 className="fw-bold">Unable to Load Patient Profile</h4>
          <p className="text-muted">{error || 'Patient not found'}</p>
          <Button as={Link} to="/patients" variant="primary" size="sm">
            &larr; Back to Patients Directory
          </Button>
        </Alert>
      </Container>
    );
  }

  const { patient, appointments, consultations, prescriptions, invoices, payments } = data;
  const birthDate = new Date(patient.dateOfBirth);
  const age = Math.floor((new Date() - birthDate) / (365.25 * 24 * 60 * 60 * 1000));

  return (
    <Container className="py-4">
      {/* Breadcrumb Navigation */}
      <div className="mb-3">
        <Link to="/patients" className="text-decoration-none small text-muted">
          &larr; Patients Directory
        </Link>
        <span className="text-muted mx-2">/</span>
        <span className="small text-dark fw-semibold">{patient.name}</span>
      </div>

      {/* Patient Dossier Header Banner */}
      <Card className="clinic-card border-0 shadow-sm mb-4">
        <Card.Body className="p-4">
          <Row className="align-items-center">
            <Col md={8}>
              <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
                <Badge bg="primary-subtle" text="primary" className="border border-primary-subtle font-monospace px-2 py-1">
                  {patient.patientCode}
                </Badge>
                <Badge bg="danger-subtle" text="danger" className="border border-danger-subtle px-2 py-1">
                  <i className="bi bi-droplet-fill me-1"></i> {patient.bloodGroup}
                </Badge>
                <StatusBadge status={patient.isActive ? 'ACTIVE' : 'INACTIVE'} />
              </div>
              <h2 className="fw-bold mb-1 text-dark">{patient.name}</h2>
              <div className="text-muted small d-flex flex-wrap gap-3 mt-2">
                <span><i className="bi bi-gender-ambiguous me-1"></i> {patient.gender}</span>
                <span><i className="bi bi-calendar-event me-1"></i> {new Date(patient.dateOfBirth).toLocaleDateString()} ({age} yrs)</span>
                <span><i className="bi bi-telephone me-1"></i> {patient.phone}</span>
                {patient.email && <span><i className="bi bi-envelope me-1"></i> {patient.email}</span>}
              </div>
            </Col>
            <Col md={4} className="text-md-end mt-3 mt-md-0">
              <div className="p-3 bg-light rounded text-start d-inline-block border">
                <div className="small fw-bold text-muted mb-1">EMERGENCY CONTACT</div>
                <div className="fw-semibold small">{patient.emergencyContact?.name || 'Not specified'}</div>
                <div className="text-muted small">
                  {patient.emergencyContact?.relationship ? `${patient.emergencyContact.relationship} • ` : ''}
                  {patient.emergencyContact?.phone || ''}
                </div>
              </div>
            </Col>
          </Row>

          {patient.medicalNotes && (
            <div className="mt-3 pt-3 border-top small text-muted">
              <strong className="text-dark"><i className="bi bi-clipboard2-pulse me-1"></i> Baseline Clinical Notes:</strong> {patient.medicalNotes}
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Tabs Layout for Linked Entities (Section 33) */}
      <Card className="clinic-card border-0 shadow-sm">
        <Card.Body className="p-4">
          <Tabs
            id="patient-dossier-tabs"
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="mb-4"
          >
            {/* 1. Appointments Tab */}
            <Tab
              eventKey="appointments"
              title={
                <span>
                  <i className="bi bi-calendar-check me-1"></i> Appointments{' '}
                  <Badge bg="secondary" pill className="ms-1">{appointments.length}</Badge>
                </span>
              }
            >
              {appointments.length === 0 ? (
                <div className="text-center py-4 text-muted">
                  <i className="bi bi-calendar-x fs-3 d-block mb-2"></i>
                  No appointments booked for this patient yet.
                </div>
              ) : (
                <Table hover responsive className="align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Code</th>
                      <th>Date & Time</th>
                      <th>Doctor</th>
                      <th>Specialization</th>
                      <th>Reason</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map((apt) => (
                      <tr key={apt._id}>
                        <td className="font-monospace small fw-bold">{apt.appointmentCode}</td>
                        <td>
                          <div className="fw-medium">{new Date(apt.appointmentDate).toLocaleDateString()}</div>
                          <div className="small text-muted">{apt.startTime} - {apt.endTime}</div>
                        </td>
                        <td className="fw-medium">{apt.doctor?.user?.name || 'Doctor'}</td>
                        <td className="small text-muted">{apt.doctor?.specialization || 'N/A'}</td>
                        <td className="small text-truncate" style={{ maxWidth: '200px' }}>{apt.reason || 'Routine Consultation'}</td>
                        <td><StatusBadge status={apt.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Tab>

            {/* 2. Consultations Tab */}
            <Tab
              eventKey="consultations"
              title={
                <span>
                  <i className="bi bi-chat-square-text me-1"></i> Consultations{' '}
                  <Badge bg="secondary" pill className="ms-1">{consultations.length}</Badge>
                </span>
              }
            >
              {consultations.length === 0 ? (
                <div className="text-center py-4 text-muted">
                  <i className="bi bi-clipboard-x fs-3 d-block mb-2"></i>
                  No completed consultations recorded.
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {consultations.map((c) => (
                    <Card key={c._id} className="border bg-light">
                      <Card.Body className="p-3">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span className="fw-bold text-primary">
                            <i className="bi bi-person-badge me-1"></i> Attended by {c.doctor?.user?.name || 'Doctor'}
                          </span>
                          <span className="small text-muted">
                            {new Date(c.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <Row className="g-2 small">
                          <Col md={6}>
                            <strong>Symptoms:</strong>
                            <p className="text-muted mb-1">{c.symptoms}</p>
                          </Col>
                          <Col md={6}>
                            <strong>Clinical Diagnosis:</strong>
                            <p className="text-danger-emphasis fw-medium mb-1">{c.diagnosis}</p>
                          </Col>
                          {c.clinicalNotes && (
                            <Col md={12}>
                              <strong>Doctor's Observations & Notes:</strong>
                              <p className="text-muted mb-1">{c.clinicalNotes}</p>
                            </Col>
                          )}
                          {c.followUpDate && (
                            <Col md={12}>
                              <Badge bg="info-subtle" text="info" className="border border-info-subtle">
                                <i className="bi bi-arrow-repeat me-1"></i> Follow-up scheduled for: {new Date(c.followUpDate).toLocaleDateString()}
                              </Badge>
                            </Col>
                          )}
                        </Row>
                      </Card.Body>
                    </Card>
                  ))}
                </div>
              )}
            </Tab>

            {/* 3. Prescriptions Tab */}
            <Tab
              eventKey="prescriptions"
              title={
                <span>
                  <i className="bi bi-prescription2 me-1"></i> Prescriptions{' '}
                  <Badge bg="secondary" pill className="ms-1">{prescriptions.length}</Badge>
                </span>
              }
            >
              {prescriptions.length === 0 ? (
                <div className="text-center py-4 text-muted">
                  <i className="bi bi-capsule fs-3 d-block mb-2"></i>
                  No prescriptions issued yet.
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {prescriptions.map((presc) => (
                    <Card key={presc._id} className="border shadow-none">
                      <div className="clinic-card-header d-flex justify-content-between align-items-center bg-white">
                        <span>
                          <i className="bi bi-file-earmark-medical text-primary me-2"></i>
                          Prescribed by <strong>{presc.doctor?.user?.name || 'Doctor'}</strong>
                        </span>
                        <span className="small text-muted">
                          {new Date(presc.prescriptionDate).toLocaleDateString()}
                        </span>
                      </div>
                      <Card.Body className="p-0">
                        <Table hover responsive className="mb-0 align-middle small">
                          <thead className="table-light">
                            <tr>
                              <th>Medicine Name</th>
                              <th>Dosage</th>
                              <th>Frequency</th>
                              <th>Duration</th>
                              <th>Route</th>
                              <th>Special Instructions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {presc.items.map((item, idx) => (
                              <tr key={idx}>
                                <td className="fw-semibold text-dark">{item.medicineName}</td>
                                <td><Badge bg="light" text="dark" className="border">{item.dosage}</Badge></td>
                                <td>{item.frequency}</td>
                                <td>{item.duration}</td>
                                <td>{item.route}</td>
                                <td className="text-muted">{item.instructions || 'As advised'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                        {presc.instructions && (
                          <div className="p-3 bg-light border-top small text-muted">
                            <strong>General Advice:</strong> {presc.instructions}
                          </div>
                        )}
                      </Card.Body>
                    </Card>
                  ))}
                </div>
              )}
            </Tab>

            {/* 4. Invoices & Billing Tab */}
            <Tab
              eventKey="invoices"
              title={
                <span>
                  <i className="bi bi-receipt me-1"></i> Billing & Invoices{' '}
                  <Badge bg="secondary" pill className="ms-1">{invoices.length}</Badge>
                </span>
              }
            >
              {invoices.length === 0 ? (
                <div className="text-center py-4 text-muted">
                  <i className="bi bi-cash-stack fs-3 d-block mb-2"></i>
                  No invoices generated for this patient yet.
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {invoices.map((inv) => (
                    <Card key={inv._id} className="border">
                      <div className="clinic-card-header d-flex justify-content-between align-items-center bg-white">
                        <div>
                          <span className="fw-bold font-monospace me-2">{inv.invoiceNumber}</span>
                          <span className="small text-muted">{new Date(inv.issuedAt).toLocaleDateString()}</span>
                        </div>
                        <StatusBadge status={inv.status} />
                      </div>
                      <Card.Body className="p-3">
                        <Table size="sm" className="mb-2 small">
                          <thead className="table-light">
                            <tr>
                              <th>Item Description</th>
                              <th className="text-center">Qty</th>
                              <th className="text-end">Unit Price</th>
                              <th className="text-end">Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {inv.items.map((it, idx) => (
                              <tr key={idx}>
                                <td>{it.description}</td>
                                <td className="text-center">{it.quantity}</td>
                                <td className="text-end">₹{it.unitPrice}</td>
                                <td className="text-end fw-medium">₹{it.amount}</td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>

                        <div className="d-flex justify-content-end">
                          <div style={{ minWidth: '220px' }} className="small border-top pt-2">
                            <div className="d-flex justify-content-between text-muted">
                              <span>Subtotal:</span>
                              <span>₹{inv.subtotal}</span>
                            </div>
                            {inv.discount > 0 && (
                              <div className="d-flex justify-content-between text-success">
                                <span>Discount:</span>
                                <span>-₹{inv.discount}</span>
                              </div>
                            )}
                            {inv.tax > 0 && (
                              <div className="d-flex justify-content-between text-muted">
                                <span>Tax:</span>
                                <span>+₹{inv.tax}</span>
                              </div>
                            )}
                            <div className="d-flex justify-content-between fw-bold text-dark border-top pt-1 mt-1">
                              <span>Total Amount:</span>
                              <span>₹{inv.totalAmount}</span>
                            </div>
                            <div className="d-flex justify-content-between text-success">
                              <span>Amount Paid:</span>
                              <span>₹{inv.amountPaid}</span>
                            </div>
                            <div className="d-flex justify-content-between fw-bold text-danger">
                              <span>Balance Due:</span>
                              <span>₹{inv.amountDue}</span>
                            </div>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  ))}
                </div>
              )}
            </Tab>

            {/* 5. Payments Tab */}
            <Tab
              eventKey="payments"
              title={
                <span>
                  <i className="bi bi-wallet2 me-1"></i> Payments{' '}
                  <Badge bg="secondary" pill className="ms-1">{payments.length}</Badge>
                </span>
              }
            >
              {payments.length === 0 ? (
                <div className="text-center py-4 text-muted">
                  <i className="bi bi-credit-card fs-3 d-block mb-2"></i>
                  No payment transactions recorded for this patient.
                </div>
              ) : (
                <Table hover responsive className="align-middle mb-0 small">
                  <thead className="table-light">
                    <tr>
                      <th>Payment Code</th>
                      <th>Invoice Ref</th>
                      <th>Method</th>
                      <th>Transaction Ref</th>
                      <th>Date</th>
                      <th className="text-end">Amount Paid</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p._id}>
                        <td className="font-monospace fw-bold">{p.paymentCode}</td>
                        <td className="font-monospace text-primary">{p.invoice?.invoiceNumber || 'N/A'}</td>
                        <td>
                          <Badge bg="light" text="dark" className="border text-uppercase">
                            {p.paymentMethod}
                          </Badge>
                        </td>
                        <td className="text-muted font-monospace">{p.transactionReference || 'N/A'}</td>
                        <td>{new Date(p.paidAt).toLocaleDateString()}</td>
                        <td className="text-end fw-bold text-success">₹{p.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default PatientDetailsPage;
