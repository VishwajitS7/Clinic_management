import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Button,
  Form,
  Badge,
  Modal,
  Alert,
  Spinner,
  Pagination,
  InputGroup,
} from 'react-bootstrap';
import { useSearchParams, useNavigate } from 'react-router-dom';
import consultationService from '../services/consultationService';
import appointmentService from '../services/appointmentService';
import doctorService from '../services/doctorService';
import { useAuth } from '../context/AuthContext';

const ConsultationsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paramAppointmentId = searchParams.get('appointmentId');

  // Consultations State
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalConsultations, setTotalConsultations] = useState(0);

  // Doctors list for filter
  const [doctorsList, setDoctorsList] = useState([]);

  // Pending / eligible appointments for consultation
  const [eligibleAppointments, setEligibleAppointments] = useState([]);

  // Record Consultation Modal State
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [recordError, setRecordError] = useState('');
  const [recordSubmitting, setRecordSubmitting] = useState(false);

  // Detail Modal State
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedConsultation, setSelectedConsultation] = useState(null);

  // Fetch doctors list for filter
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await doctorService.getAllDoctors({ limit: 100 });
        setDoctorsList(res.data || []);
      } catch (err) {
        console.error('Failed to load doctors:', err);
      }
    };
    fetchDoctors();
  }, []);

  // Fetch eligible appointments (SCHEDULED or CONFIRMED)
  const fetchEligibleAppointments = useCallback(async () => {
    try {
      const res = await appointmentService.getAppointments({ limit: 100 });
      const active = (res.data || []).filter(
        (apt) => apt.status === 'CONFIRMED' || apt.status === 'SCHEDULED'
      );
      setEligibleAppointments(active);
    } catch (err) {
      console.error('Failed to fetch eligible appointments:', err);
    }
  }, []);

  useEffect(() => {
    fetchEligibleAppointments();
  }, [fetchEligibleAppointments]);

  // If appointmentId is passed via URL query, open recording modal automatically
  useEffect(() => {
    if (paramAppointmentId) {
      setSelectedAppointmentId(paramAppointmentId);
      setShowRecordModal(true);
    }
  }, [paramAppointmentId]);

  // Fetch Consultations
  const fetchConsultations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: 10,
        search: search.trim() || undefined,
        doctorId: selectedDoctorFilter || undefined,
      };

      const res = await consultationService.getConsultations(params);
      setConsultations(res.data || []);
      if (res.pagination) {
        setTotalPages(res.pagination.totalPages || 1);
        setTotalConsultations(res.pagination.total || 0);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch consultations');
    } finally {
      setLoading(false);
    }
  }, [page, search, selectedDoctorFilter]);

  useEffect(() => {
    fetchConsultations();
  }, [fetchConsultations]);

  // Handle Record Consultation Submit
  const handleRecordSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAppointmentId) {
      setRecordError('Please select an appointment');
      return;
    }
    if (!symptoms.trim()) {
      setRecordError('Please record patient symptoms');
      return;
    }
    if (!diagnosis.trim()) {
      setRecordError('Please record clinical diagnosis');
      return;
    }

    setRecordSubmitting(true);
    setRecordError('');

    try {
      await consultationService.createConsultation({
        appointmentId: selectedAppointmentId,
        symptoms: symptoms.trim(),
        diagnosis: diagnosis.trim(),
        clinicalNotes: clinicalNotes.trim(),
        followUpDate: followUpDate || undefined,
      });

      setShowRecordModal(false);
      setSuccessMsg('Consultation recorded successfully and appointment marked as COMPLETED!');
      setTimeout(() => setSuccessMsg(''), 5000);
      // Reset form
      setSelectedAppointmentId('');
      setSymptoms('');
      setDiagnosis('');
      setClinicalNotes('');
      setFollowUpDate('');
      fetchConsultations();
      fetchEligibleAppointments();
    } catch (err) {
      setRecordError(err.response?.data?.message || 'Failed to record consultation');
    } finally {
      setRecordSubmitting(false);
    }
  };

  // Open Detail Modal
  const openDetailModal = async (consultationId) => {
    try {
      const res = await consultationService.getConsultationById(consultationId);
      setSelectedConsultation(res.data);
      setShowDetailModal(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load consultation details');
    }
  };

  return (
    <Container className="py-4">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1 d-flex align-items-center gap-2">
            <i className="bi bi-clipboard2-pulse text-primary"></i>
            Clinical Consultations
          </h2>
          <p className="text-muted mb-0 small">
            Physician diagnostic notes, symptoms evaluation, and medical encounter records.
          </p>
        </div>
        {(user?.role === 'ADMIN' || user?.role === 'DOCTOR') && (
          <div>
            <Button
              variant="primary"
              className="d-flex align-items-center gap-2 shadow-sm"
              onClick={() => {
                setShowRecordModal(true);
                setRecordError('');
              }}
            >
              <i className="bi bi-plus-circle"></i>
              Record Consultation
            </Button>
          </div>
        )}
      </div>

      {/* Alerts */}
      {successMsg && (
        <Alert variant="success" dismissible onClose={() => setSuccessMsg('')} className="py-2 small">
          <i className="bi bi-check-circle me-1"></i> {successMsg}
        </Alert>
      )}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)} className="py-2 small">
          <i className="bi bi-exclamation-triangle me-1"></i> {error}
        </Alert>
      )}

      {/* Filter Toolbar */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body className="p-3">
          <Row className="g-2">
            <Col xs={12} md={7}>
              <InputGroup size="sm">
                <InputGroup.Text className="bg-light border-end-0">
                  <i className="bi bi-search text-muted"></i>
                </InputGroup.Text>
                <Form.Control
                  placeholder="Search symptoms or diagnosis..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="border-start-0"
                />
              </InputGroup>
            </Col>
            <Col xs={12} md={5}>
              <Form.Select
                size="sm"
                value={selectedDoctorFilter}
                onChange={(e) => {
                  setSelectedDoctorFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Attending Doctors</option>
                {doctorsList.map((doc) => (
                  <option key={doc._id} value={doc._id}>
                    {doc.user?.name} ({doc.specialization})
                  </option>
                ))}
              </Form.Select>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Consultations Table */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Header className="bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
          <div className="fw-semibold">
            <i className="bi bi-journal-medical me-2 text-primary"></i>
            Recorded Encounters ({totalConsultations})
          </div>
          <Button variant="outline-secondary" size="sm" onClick={fetchConsultations} disabled={loading}>
            <i className={`bi bi-arrow-clockwise ${loading ? 'spin' : ''}`}></i> Refresh
          </Button>
        </Card.Header>
        <div className="table-responsive">
          <Table hover align="middle" className="mb-0">
            <thead className="table-light text-muted small text-uppercase">
              <tr>
                <th>Date & Appointment</th>
                <th>Patient</th>
                <th>Attending Doctor</th>
                <th>Symptoms</th>
                <th>Diagnosis</th>
                <th>Follow-up</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-5 text-muted">
                    <Spinner animation="border" size="sm" className="me-2" />
                    Loading clinical encounters...
                  </td>
                </tr>
              ) : consultations.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-5 text-muted">
                    <i className="bi bi-file-earmark-medical fs-2 d-block text-secondary mb-2"></i>
                    No consultations recorded yet.
                  </td>
                </tr>
              ) : (
                consultations.map((c) => {
                  const encounterDate = new Date(c.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });

                  return (
                    <tr key={c._id}>
                      <td>
                        <div className="fw-medium text-dark">{encounterDate}</div>
                        <span className="font-monospace small text-primary">
                          {c.appointment?.appointmentCode || 'N/A'}
                        </span>
                      </td>
                      <td>
                        <div className="fw-semibold text-dark">
                          {c.patient?.name || (c.patient?.firstName ? `${c.patient.firstName} ${c.patient.lastName || ''}`.trim() : 'Patient')}
                        </div>
                        <div className="text-muted small">
                          {c.patient?.patientCode} &bull; {c.patient?.bloodGroup || 'Blood N/A'}
                        </div>
                      </td>
                      <td>
                        <div className="fw-semibold text-dark">
                          {c.doctor?.user?.name || 'Physician'}
                        </div>
                        <div className="text-muted small">
                          {c.doctor?.specialization || 'General'}
                        </div>
                      </td>
                      <td>
                        <span className="small text-muted text-truncate d-inline-block" style={{ maxWidth: '180px' }}>
                          {c.symptoms}
                        </span>
                      </td>
                      <td>
                        <Badge bg="primary-subtle" className="text-primary border border-primary-subtle fw-medium px-2 py-1">
                          {c.diagnosis}
                        </Badge>
                      </td>
                      <td>
                        {c.followUpDate ? (
                          <span className="small text-secondary font-monospace">
                            <i className="bi bi-calendar-event me-1"></i>
                            {new Date(c.followUpDate).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-muted small">None</span>
                        )}
                      </td>
                      <td className="text-end">
                        <div className="d-flex justify-content-end gap-1">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            title="View Clinical Dossier"
                            onClick={() => openDetailModal(c._id)}
                          >
                            <i className="bi bi-eye"></i>
                          </Button>
                          {(user?.role === 'ADMIN' || user?.role === 'DOCTOR') && (
                            <Button
                              variant="outline-success"
                              size="sm"
                              title="Write / View Prescription"
                              onClick={() => navigate(`/prescriptions?consultationId=${c._id}`)}
                            >
                              <i className="bi bi-capsule"></i>
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </Table>
        </div>
        {/* Pagination */}
        {totalPages > 1 && (
          <Card.Footer className="bg-white border-top d-flex justify-content-between align-items-center py-2">
            <span className="small text-muted">
              Page {page} of {totalPages} ({totalConsultations} total)
            </span>
            <Pagination size="sm" className="mb-0">
              <Pagination.Prev
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              />
              {[...Array(totalPages)].map((_, i) => (
                <Pagination.Item
                  key={i + 1}
                  active={i + 1 === page}
                  onClick={() => setPage(i + 1)}
                >
                  {i + 1}
                </Pagination.Item>
              ))}
              <Pagination.Next
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              />
            </Pagination>
          </Card.Footer>
        )}
      </Card>

      {/* Record Consultation Modal */}
      <Modal show={showRecordModal} onHide={() => setShowRecordModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title className="h5 fw-bold d-flex align-items-center gap-2">
            <i className="bi bi-clipboard2-plus text-primary"></i>
            Record Clinical Encounter
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleRecordSubmit}>
          <Modal.Body className="p-4">
            {recordError && (
              <Alert variant="danger" className="py-2 small">
                <i className="bi bi-exclamation-triangle me-1"></i> {recordError}
              </Alert>
            )}

            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold text-muted">
                SELECT APPOINTMENT <span className="text-danger">*</span>
              </Form.Label>
              <Form.Select
                value={selectedAppointmentId}
                onChange={(e) => setSelectedAppointmentId(e.target.value)}
                required
              >
                <option value="">-- Choose Active Appointment --</option>
                {eligibleAppointments.map((apt) => (
                  <option key={apt._id} value={apt._id}>
                    {apt.appointmentCode} &bull; {apt.patient?.name || `${apt.patient?.firstName || ''} ${apt.patient?.lastName || ''}`.trim()} &bull; Dr. {apt.doctor?.user?.name} ({apt.startTime})
                  </option>
                ))}
              </Form.Select>
              <Form.Text className="text-muted small">
                Saving this consultation will automatically mark the appointment status as COMPLETED.
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold text-muted">
                PRESENTING SYMPTOMS & CHIEF COMPLAINTS <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                placeholder="Detailed patient symptoms, onset, severity, duration..."
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold text-muted">
                CLINICAL DIAGNOSIS <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                placeholder="e.g. Essential Hypertension, Acute Bronchitis..."
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold text-muted">
                EXAMINATION & CLINICAL NOTES
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Physical examination observations, vital checks, dietary recommendations..."
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold text-muted">RECOMMENDED FOLLOW-UP DATE</Form.Label>
              <Form.Control
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setShowRecordModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={recordSubmitting}>
              {recordSubmitting ? (
                <>
                  <Spinner animation="border" size="sm" className="me-1" />
                  Finalizing encounter...
                </>
              ) : (
                <>
                  <i className="bi bi-check-circle me-1"></i>
                  Save & Complete Consultation
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Consultation Dossier Detail Modal */}
      <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title className="h5 fw-bold d-flex align-items-center gap-2">
            <i className="bi bi-file-earmark-medical text-primary"></i>
            Clinical Encounter Dossier
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {selectedConsultation && (
            <div className="d-flex flex-column gap-3">
              {/* Header Info */}
              <div className="d-flex justify-content-between align-items-center border-bottom pb-3">
                <div>
                  <h6 className="fw-bold text-dark mb-0">
                    Patient: {selectedConsultation.patient?.name || `${selectedConsultation.patient?.firstName || ''} ${selectedConsultation.patient?.lastName || ''}`.trim()}
                  </h6>
                  <span className="small text-muted">
                    Code: {selectedConsultation.patient?.patientCode} | Blood Group: {selectedConsultation.patient?.bloodGroup || 'N/A'}
                  </span>
                </div>
                <div className="text-end">
                  <div className="fw-semibold text-primary">
                    Dr. {selectedConsultation.doctor?.user?.name}
                  </div>
                  <div className="small text-muted">{selectedConsultation.doctor?.specialization}</div>
                </div>
              </div>

              {/* Diagnosis Badge */}
              <div className="p-3 bg-light rounded border">
                <div className="small text-muted text-uppercase fw-semibold mb-1">Diagnosis</div>
                <h5 className="text-primary fw-bold mb-0">{selectedConsultation.diagnosis}</h5>
              </div>

              {/* Symptoms */}
              <div>
                <span className="small text-muted text-uppercase fw-semibold d-block mb-1">
                  Reported Symptoms
                </span>
                <p className="small mb-0 text-dark bg-light p-2 rounded border">
                  {selectedConsultation.symptoms}
                </p>
              </div>

              {/* Clinical Notes */}
              {selectedConsultation.clinicalNotes && (
                <div>
                  <span className="small text-muted text-uppercase fw-semibold d-block mb-1">
                    Physician Clinical Notes
                  </span>
                  <p className="small mb-0 text-dark bg-light p-2 rounded border">
                    {selectedConsultation.clinicalNotes}
                  </p>
                </div>
              )}

              {/* Follow-up */}
              {selectedConsultation.followUpDate && (
                <div className="small">
                  <strong className="text-muted">Recommended Follow-up: </strong>
                  <span className="text-primary fw-semibold">
                    {new Date(selectedConsultation.followUpDate).toDateString()}
                  </span>
                </div>
              )}

              {/* Linked Prescription Section */}
              <div className="border-top pt-3 mt-2">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="small text-muted text-uppercase fw-semibold">
                    Linked Medical Prescription
                  </span>
                  {selectedConsultation.prescription ? (
                    <Badge bg="success" pill>Prescription Active</Badge>
                  ) : (
                    <Badge bg="secondary" pill>No Prescription Yet</Badge>
                  )}
                </div>
                {selectedConsultation.prescription ? (
                  <div className="p-3 bg-light rounded border">
                    <div className="small fw-semibold text-dark mb-2">Prescribed Medicines:</div>
                    <ul className="mb-0 small ps-3">
                      {selectedConsultation.prescription.items?.map((item, idx) => (
                        <li key={idx} className="mb-1">
                          <strong>{item.medicineName}</strong> - {item.dosage} ({item.frequency}, {item.duration})
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  (user?.role === 'ADMIN' || user?.role === 'DOCTOR') && (
                    <Button
                      variant="outline-success"
                      size="sm"
                      onClick={() => {
                        setShowDetailModal(false);
                        navigate(`/prescriptions?consultationId=${selectedConsultation._id}`);
                      }}
                    >
                      <i className="bi bi-capsule me-1"></i>
                      Issue Prescription Now
                    </Button>
                  )
                )}
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ConsultationsPage;
