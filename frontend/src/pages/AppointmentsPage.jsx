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
import { useNavigate, useSearchParams } from 'react-router-dom';
import appointmentService from '../services/appointmentService';
import doctorService from '../services/doctorService';
import patientService from '../services/patientService';
import scheduleService from '../services/scheduleService';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/common/StatusBadge';
import TimeSlotSelector from '../components/schedules/TimeSlotSelector';

const AppointmentsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Appointments State
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('');
  const [selectedDateFilter, setSelectedDateFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAppointments, setTotalAppointments] = useState(0);

  // References State for Dropdowns
  const [doctorsList, setDoctorsList] = useState([]);
  const [patientsList, setPatientsList] = useState([]);

  // Booking Modal State
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingPatient, setBookingPatient] = useState('');
  const [bookingDoctor, setBookingDoctor] = useState('');
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [bookingReason, setBookingReason] = useState('');
  const [bookingNotes, setBookingNotes] = useState('');
  const [bookingError, setBookingError] = useState('');
  const [bookingSubmitting, setBookingSubmitting] = useState(false);

  // Reschedule Modal State
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedAptForReschedule, setSelectedAptForReschedule] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleSlots, setRescheduleSlots] = useState([]);
  const [selectedRescheduleSlot, setSelectedRescheduleSlot] = useState(null);
  const [rescheduleSlotsLoading, setRescheduleSlotsLoading] = useState(false);
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [rescheduleError, setRescheduleError] = useState('');
  const [rescheduleSubmitting, setRescheduleSubmitting] = useState(false);

  // Detail Modal State
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAptDetail, setSelectedAptDetail] = useState(null);

  // Cancel Modal State
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [aptToCancel, setAptToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelSubmitting, setCancelSubmitting] = useState(false);

  // Fetch reference lists (Doctors and Patients)
  useEffect(() => {
    const fetchReferences = async () => {
      try {
        const [docsRes, patsRes] = await Promise.all([
          doctorService.getAllDoctors({ limit: 100 }),
          patientService.getAllPatients({ limit: 100 }),
        ]);
        setDoctorsList(docsRes.data || []);
        setPatientsList(patsRes.data || []);
      } catch (err) {
        console.error('Failed to load reference lists:', err);
      }
    };
    fetchReferences();
  }, []);

  // Pre-fill booking modal if URL search params provided (e.g. from doctor schedule or patient dossier)
  const [searchParams] = useSearchParams();
  const paramDoctorId = searchParams.get('doctorId');
  const paramPatientId = searchParams.get('patientId');
  const paramDate = searchParams.get('date');
  const paramStartTime = searchParams.get('startTime');
  const paramEndTime = searchParams.get('endTime');

  useEffect(() => {
    if (paramDoctorId || paramDate || paramPatientId) {
      if (paramDoctorId) setBookingDoctor(paramDoctorId);
      if (paramPatientId) setBookingPatient(paramPatientId);
      if (paramDate) setBookingDate(paramDate);
      if (paramStartTime && paramEndTime) {
        setSelectedSlot({ startTime: paramStartTime, endTime: paramEndTime, available: true });
      }
      setShowBookingModal(true);
    }
  }, [paramDoctorId, paramPatientId, paramDate, paramStartTime, paramEndTime]);

  // Fetch Appointments
  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: 10,
        search: search.trim() || undefined,
        doctorId: selectedDoctorFilter || undefined,
        status: selectedStatusFilter || undefined,
        date: selectedDateFilter || undefined,
      };

      const res = await appointmentService.getAppointments(params);
      setAppointments(res.data || []);
      if (res.pagination) {
        setTotalPages(res.pagination.totalPages || 1);
        setTotalAppointments(res.pagination.total || 0);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  }, [page, search, selectedDoctorFilter, selectedStatusFilter, selectedDateFilter]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Fetch dynamic available slots when booking doctor and date change
  useEffect(() => {
    if (!bookingDoctor || !bookingDate) {
      setAvailableSlots([]);
      setSelectedSlot(null);
      return;
    }

    const fetchSlots = async () => {
      setSlotsLoading(true);
      setBookingError('');
      try {
        const res = await scheduleService.getDoctorAvailableSlots(bookingDoctor, bookingDate);
        setAvailableSlots(res.data?.slots || []);
        setSelectedSlot(null);
      } catch (err) {
        setBookingError(err.response?.data?.message || 'Failed to compute doctor availability');
        setAvailableSlots([]);
      } finally {
        setSlotsLoading(false);
      }
    };

    fetchSlots();
  }, [bookingDoctor, bookingDate]);

  // Fetch dynamic available slots when reschedule date changes
  useEffect(() => {
    if (!selectedAptForReschedule || !rescheduleDate) {
      setRescheduleSlots([]);
      setSelectedRescheduleSlot(null);
      return;
    }

    const fetchRescheduleSlots = async () => {
      setRescheduleSlotsLoading(true);
      setRescheduleError('');
      try {
        const docId = selectedAptForReschedule.doctor?._id || selectedAptForReschedule.doctor;
        const res = await scheduleService.getDoctorAvailableSlots(docId, rescheduleDate);
        setRescheduleSlots(res.data?.slots || []);
        setSelectedRescheduleSlot(null);
      } catch (err) {
        setRescheduleError(err.response?.data?.message || 'Failed to compute availability');
        setRescheduleSlots([]);
      } finally {
        setRescheduleSlotsLoading(false);
      }
    };

    fetchRescheduleSlots();
  }, [selectedAptForReschedule, rescheduleDate]);

  // Handle Book Appointment Submit
  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!bookingPatient) {
      setBookingError('Please select a patient');
      return;
    }
    if (!bookingDoctor) {
      setBookingError('Please select a doctor');
      return;
    }
    if (!selectedSlot) {
      setBookingError('Please select an available clinical time slot');
      return;
    }

    setBookingSubmitting(true);
    setBookingError('');

    try {
      await appointmentService.createAppointment({
        patient: bookingPatient,
        doctor: bookingDoctor,
        appointmentDate: bookingDate,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        reason: bookingReason.trim(),
        notes: bookingNotes.trim(),
      });

      setShowBookingModal(false);
      setSuccessMsg('Appointment booked successfully!');
      setTimeout(() => setSuccessMsg(''), 5000);
      // Reset form
      setBookingPatient('');
      setBookingDoctor('');
      setSelectedSlot(null);
      setBookingReason('');
      setBookingNotes('');
      // Reset filter states so newly booked appointment is immediately visible
      setSelectedDoctorFilter('');
      setSelectedStatusFilter('');
      setSelectedDateFilter('');
      setSearch('');
      setPage(1);
      fetchAppointments();
    } catch (err) {
      setBookingError(err.response?.data?.message || 'Failed to book appointment');
    } finally {
      setBookingSubmitting(false);
    }
  };

  // Handle Status Update (Confirm, Complete)
  const handleStatusUpdate = async (aptId, newStatus) => {
    try {
      await appointmentService.updateAppointmentStatus(aptId, newStatus);
      setSuccessMsg(`Appointment status updated to ${newStatus}`);
      setTimeout(() => setSuccessMsg(''), 4000);
      fetchAppointments();
    } catch (err) {
      setError(err.response?.data?.message || `Failed to update status to ${newStatus}`);
    }
  };

  // Open Reschedule Modal
  const openRescheduleModal = (apt) => {
    setSelectedAptForReschedule(apt);
    const currentDate = apt.appointmentDate ? apt.appointmentDate.split('T')[0] : '';
    setRescheduleDate(currentDate);
    setSelectedRescheduleSlot(null);
    setRescheduleReason('');
    setRescheduleError('');
    setShowRescheduleModal(true);
  };

  // Handle Reschedule Submit
  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRescheduleSlot) {
      setRescheduleError('Please select a new available time slot');
      return;
    }

    setRescheduleSubmitting(true);
    setRescheduleError('');

    try {
      await appointmentService.rescheduleAppointment(selectedAptForReschedule._id, {
        appointmentDate: rescheduleDate,
        startTime: selectedRescheduleSlot.startTime,
        endTime: selectedRescheduleSlot.endTime,
        reason: rescheduleReason.trim(),
      });

      setShowRescheduleModal(false);
      setSuccessMsg('Appointment rescheduled successfully!');
      setTimeout(() => setSuccessMsg(''), 5000);
      fetchAppointments();
    } catch (err) {
      setRescheduleError(err.response?.data?.message || 'Failed to reschedule appointment');
    } finally {
      setRescheduleSubmitting(false);
    }
  };

  // Open Cancel Modal
  const openCancelModal = (apt) => {
    setAptToCancel(apt);
    setCancelReason('');
    setShowCancelModal(true);
  };

  // Handle Cancel Submit
  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    setCancelSubmitting(true);
    try {
      await appointmentService.cancelAppointment(aptToCancel._id, cancelReason);
      setShowCancelModal(false);
      setSuccessMsg(`Appointment ${aptToCancel.appointmentCode} has been cancelled`);
      setTimeout(() => setSuccessMsg(''), 5000);
      fetchAppointments();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel appointment');
    } finally {
      setCancelSubmitting(false);
    }
  };

  return (
    <Container className="py-4">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1 d-flex align-items-center gap-2">
            <i className="bi bi-calendar-check text-primary"></i>
            Appointments Engine
          </h2>
          <p className="text-muted mb-0 small">
            Interval conflict-managed clinical appointment scheduling and status lifecycle.
          </p>
        </div>
        <div>
          <Button
            variant="primary"
            className="d-flex align-items-center gap-2 shadow-sm"
            onClick={() => setShowBookingModal(true)}
          >
            <i className="bi bi-plus-circle"></i>
            Book New Appointment
          </Button>
        </div>
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
            <Col xs={12} md={4}>
              <InputGroup size="sm">
                <InputGroup.Text className="bg-light border-end-0">
                  <i className="bi bi-search text-muted"></i>
                </InputGroup.Text>
                <Form.Control
                  placeholder="Search by code or reason..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="border-start-0"
                />
              </InputGroup>
            </Col>
            <Col xs={6} md={3}>
              <Form.Select
                size="sm"
                value={selectedDoctorFilter}
                onChange={(e) => {
                  setSelectedDoctorFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Doctors</option>
                {doctorsList.map((doc) => (
                  <option key={doc._id} value={doc._id}>
                    {doc.user?.name} ({doc.specialization})
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col xs={6} md={3}>
              <Form.Select
                size="sm"
                value={selectedStatusFilter}
                onChange={(e) => {
                  setSelectedStatusFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Statuses</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="NO_SHOW">No Show</option>
              </Form.Select>
            </Col>
            <Col xs={12} md={2}>
              <Form.Control
                type="date"
                size="sm"
                value={selectedDateFilter}
                onChange={(e) => {
                  setSelectedDateFilter(e.target.value);
                  setPage(1);
                }}
              />
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Appointments Table */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Header className="bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
          <div className="fw-semibold">
            <i className="bi bi-list-check me-2 text-primary"></i>
            Scheduled Consultations ({totalAppointments})
          </div>
          <Button variant="outline-secondary" size="sm" onClick={fetchAppointments} disabled={loading}>
            <i className={`bi bi-arrow-clockwise ${loading ? 'spin' : ''}`}></i> Refresh
          </Button>
        </Card.Header>
        <div className="table-responsive">
          <Table hover align="middle" className="mb-0">
            <thead className="table-light text-muted small text-uppercase">
              <tr>
                <th>Appointment Code</th>
                <th>Patient</th>
                <th>Doctor & Specialization</th>
                <th>Date & Slot</th>
                <th>Status</th>
                <th>Reason</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-5 text-muted">
                    <Spinner animation="border" size="sm" className="me-2" />
                    Loading clinical appointments...
                  </td>
                </tr>
              ) : appointments.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-5 text-muted">
                    <i className="bi bi-calendar-x fs-2 d-block text-secondary mb-2"></i>
                    No appointments found matching your criteria.
                  </td>
                </tr>
              ) : (
                appointments.map((apt) => {
                  const aptDateStr = apt.appointmentDate
                    ? new Date(apt.appointmentDate).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'N/A';

                  return (
                    <tr key={apt._id}>
                      <td>
                        <span className="fw-bold font-monospace text-primary">
                          {apt.appointmentCode}
                        </span>
                      </td>
                      <td>
                        <div className="fw-semibold text-dark">
                          {apt.patient?.name || (apt.patient?.firstName ? `${apt.patient.firstName} ${apt.patient.lastName || ''}`.trim() : 'Patient')}
                        </div>
                        <div className="text-muted small">
                          {apt.patient?.patientCode} &bull; {apt.patient?.phone || 'No phone'}
                        </div>
                      </td>
                      <td>
                        <div className="fw-semibold text-dark">
                          {apt.doctor?.user?.name || 'Doctor'}
                        </div>
                        <Badge bg="secondary-subtle" className="text-secondary border small">
                          {apt.doctor?.specialization || 'General'}
                        </Badge>
                      </td>
                      <td>
                        <div className="fw-medium text-dark">{aptDateStr}</div>
                        <div className="text-primary small font-monospace">
                          <i className="bi bi-clock me-1"></i>
                          {apt.startTime} - {apt.endTime}
                        </div>
                      </td>
                      <td>
                        <StatusBadge status={apt.status} />
                      </td>
                      <td>
                        <span className="small text-muted text-truncate d-inline-block" style={{ maxWidth: '160px' }}>
                          {apt.reason || 'General Consultation'}
                        </span>
                      </td>
                      <td className="text-end">
                        <div className="d-flex justify-content-end gap-1">
                          <Button
                            variant="outline-info"
                            size="sm"
                            title="View Details"
                            onClick={() => {
                              setSelectedAptDetail(apt);
                              setShowDetailModal(true);
                            }}
                          >
                            <i className="bi bi-eye"></i>
                          </Button>

                          {/* Confirm action for SCHEDULED */}
                          {apt.status === 'SCHEDULED' && (
                            <Button
                              variant="outline-success"
                              size="sm"
                              title="Confirm Appointment"
                              onClick={() => handleStatusUpdate(apt._id, 'CONFIRMED')}
                            >
                              <i className="bi bi-check-lg"></i>
                            </Button>
                          )}

                          {/* Reschedule action for SCHEDULED or CONFIRMED */}
                          {(apt.status === 'SCHEDULED' || apt.status === 'CONFIRMED') && (
                            <Button
                              variant="outline-warning"
                              size="sm"
                              title="Reschedule"
                              onClick={() => openRescheduleModal(apt)}
                            >
                              <i className="bi bi-calendar-range"></i>
                            </Button>
                          )}

                          {/* Cancel action for SCHEDULED or CONFIRMED */}
                          {(apt.status === 'SCHEDULED' || apt.status === 'CONFIRMED') && (
                            <Button
                              variant="outline-danger"
                              size="sm"
                              title="Cancel Appointment"
                              onClick={() => openCancelModal(apt)}
                            >
                              <i className="bi bi-x-circle"></i>
                            </Button>
                          )}

                          {/* Direct Consultation Link if confirmed or completed */}
                          {(apt.status === 'CONFIRMED' || apt.status === 'SCHEDULED') && (
                            <Button
                              variant="primary"
                              size="sm"
                              title="Conduct Consultation"
                              onClick={() => navigate(`/consultations?appointmentId=${apt._id}`)}
                            >
                              <i className="bi bi-clipboard2-pulse"></i>
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
              Page {page} of {totalPages} ({totalAppointments} total)
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

      {/* Section 39: Step-by-Step Booking Modal */}
      <Modal show={showBookingModal} onHide={() => setShowBookingModal(false)} size="lg" centered>
        <Modal.Header closeButton className="border-bottom">
          <Modal.Title className="h5 fw-bold d-flex align-items-center gap-2">
            <i className="bi bi-calendar-plus text-primary"></i>
            Book Clinical Appointment
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleBookingSubmit}>
          <Modal.Body className="p-4">
            {bookingError && (
              <Alert variant="danger" className="py-2 small">
                <i className="bi bi-exclamation-octagon me-1"></i> {bookingError}
              </Alert>
            )}

            <Row className="g-3 mb-3">
              {/* Step 1: Patient Selection */}
              <Col xs={12} md={6}>
                <Form.Group>
                  <Form.Label className="small fw-semibold text-muted">
                    1. SELECT PATIENT <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Select
                    value={bookingPatient}
                    onChange={(e) => setBookingPatient(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Patient --</option>
                    {patientsList.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.patientCode} - {p.name || `${p.firstName || ''} ${p.lastName || ''}`.trim()} ({p.phone})
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              {/* Step 2: Doctor Selection */}
              <Col xs={12} md={6}>
                <Form.Group>
                  <Form.Label className="small fw-semibold text-muted">
                    2. SELECT DOCTOR <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Select
                    value={bookingDoctor}
                    onChange={(e) => setBookingDoctor(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Specialist --</option>
                    {doctorsList.map((doc) => (
                      <option key={doc._id} value={doc._id}>
                        {doc.user?.name} - {doc.specialization} (Fee: ₹{doc.consultationFee})
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            {/* Step 3: Date Picker */}
            <Row className="g-3 mb-3">
              <Col xs={12} md={6}>
                <Form.Group>
                  <Form.Label className="small fw-semibold text-muted">
                    3. APPOINTMENT DATE <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="date"
                    value={bookingDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setBookingDate(e.target.value)}
                    required
                  />
                  <Form.Text className="text-muted small">
                    Slots are dynamically calculated for the doctor's weekly shift on this date.
                  </Form.Text>
                </Form.Group>
              </Col>

              {/* Step 4: Reason */}
              <Col xs={12} md={6}>
                <Form.Group>
                  <Form.Label className="small fw-semibold text-muted">
                    PRIMARY REASON / CHIEF COMPLAINT
                  </Form.Label>
                  <Form.Control
                    placeholder="e.g. Follow-up chest pain, seasonal allergy..."
                    value={bookingReason}
                    onChange={(e) => setBookingReason(e.target.value)}
                  />
                </Form.Group>
              </Col>
            </Row>

            {/* Step 5: Dynamic Time Slot Selector (Zero Hardcoded Slots) */}
            <div className="mb-3 p-3 bg-light rounded border">
              <TimeSlotSelector
                slots={availableSlots}
                selectedSlot={selectedSlot}
                onSelectSlot={(slot) => setSelectedSlot(slot)}
                loading={slotsLoading}
              />
              {selectedSlot && (
                <div className="mt-2 text-success small fw-semibold">
                  <i className="bi bi-check2-circle me-1"></i>
                  Selected slot: {selectedSlot.startTime} - {selectedSlot.endTime}
                </div>
              )}
            </div>

            <Form.Group>
              <Form.Label className="small fw-semibold text-muted">INTERNAL CLINICAL NOTES</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                placeholder="Optional notes for receptionist or physician..."
                value={bookingNotes}
                onChange={(e) => setBookingNotes(e.target.value)}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-top">
            <Button variant="outline-secondary" onClick={() => setShowBookingModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={bookingSubmitting || !selectedSlot}
              className="d-flex align-items-center gap-1"
            >
              {bookingSubmitting ? (
                <>
                  <Spinner animation="border" size="sm" />
                  Reserving interval...
                </>
              ) : (
                <>
                  <i className="bi bi-check2"></i>
                  Confirm & Book Slot
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Reschedule Modal */}
      <Modal show={showRescheduleModal} onHide={() => setShowRescheduleModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title className="h5 fw-bold">
            Reschedule Appointment: {selectedAptForReschedule?.appointmentCode}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleRescheduleSubmit}>
          <Modal.Body className="p-4">
            {rescheduleError && (
              <Alert variant="danger" className="py-2 small">
                <i className="bi bi-exclamation-triangle me-1"></i> {rescheduleError}
              </Alert>
            )}

            <div className="mb-3 p-2 bg-light rounded small">
              <strong>Current Booking:</strong> {selectedAptForReschedule?.patient?.name || `${selectedAptForReschedule?.patient?.firstName || ''} ${selectedAptForReschedule?.patient?.lastName || ''}`.trim()} with {selectedAptForReschedule?.doctor?.user?.name} at{' '}
              {selectedAptForReschedule?.startTime} - {selectedAptForReschedule?.endTime}
            </div>

            <Row className="g-3 mb-3">
              <Col xs={12} md={6}>
                <Form.Group>
                  <Form.Label className="small fw-semibold text-muted">
                    NEW APPOINTMENT DATE <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="date"
                    value={rescheduleDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    required
                  />
                </Form.Group>
              </Col>
              <Col xs={12} md={6}>
                <Form.Group>
                  <Form.Label className="small fw-semibold text-muted">REASON FOR RESCHEDULING</Form.Label>
                  <Form.Control
                    placeholder="e.g. Patient requested morning slot..."
                    value={rescheduleReason}
                    onChange={(e) => setRescheduleReason(e.target.value)}
                  />
                </Form.Group>
              </Col>
            </Row>

            <div className="mb-3 p-3 bg-light rounded border">
              <TimeSlotSelector
                slots={rescheduleSlots}
                selectedSlot={selectedRescheduleSlot}
                onSelectSlot={(slot) => setSelectedRescheduleSlot(slot)}
                loading={rescheduleSlotsLoading}
              />
              {selectedRescheduleSlot && (
                <div className="mt-2 text-success small fw-semibold">
                  <i className="bi bi-check2-circle me-1"></i>
                  New slot: {selectedRescheduleSlot.startTime} - {selectedRescheduleSlot.endTime}
                </div>
              )}
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setShowRescheduleModal(false)}>
              Close
            </Button>
            <Button
              variant="warning"
              type="submit"
              disabled={rescheduleSubmitting || !selectedRescheduleSlot}
            >
              {rescheduleSubmitting ? 'Rescheduling...' : 'Confirm Reschedule'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Appointment Detail Modal */}
      <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="h5 fw-bold">Appointment Dossier</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {selectedAptDetail && (
            <div className="d-flex flex-column gap-3">
              <div className="d-flex justify-content-between align-items-center border-bottom pb-2">
                <div>
                  <span className="font-monospace text-primary fw-bold fs-5">
                    {selectedAptDetail.appointmentCode}
                  </span>
                  <div className="text-muted small">
                    Created on {new Date(selectedAptDetail.createdAt).toLocaleString()}
                  </div>
                </div>
                <StatusBadge status={selectedAptDetail.status} />
              </div>

              <div>
                <span className="small text-muted text-uppercase fw-semibold d-block mb-1">
                  Patient Information
                </span>
                <div className="fw-semibold">
                  {selectedAptDetail.patient?.name || `${selectedAptDetail.patient?.firstName || ''} ${selectedAptDetail.patient?.lastName || ''}`.trim()}
                </div>
                <div className="small text-muted">
                  Code: {selectedAptDetail.patient?.patientCode} | Phone: {selectedAptDetail.patient?.phone} | Gender: {selectedAptDetail.patient?.gender}
                </div>
              </div>

              <div>
                <span className="small text-muted text-uppercase fw-semibold d-block mb-1">
                  Assigned Physician
                </span>
                <div className="fw-semibold">
                  {selectedAptDetail.doctor?.user?.name}
                </div>
                <div className="small text-muted">
                  Specialization: {selectedAptDetail.doctor?.specialization} | Room: {selectedAptDetail.doctor?.roomNumber || 'Consultation Desk'}
                </div>
              </div>

              <div>
                <span className="small text-muted text-uppercase fw-semibold d-block mb-1">
                  Schedule Details
                </span>
                <div className="fw-semibold">
                  {new Date(selectedAptDetail.appointmentDate).toDateString()}
                </div>
                <div className="text-primary font-monospace small">
                  Slot: {selectedAptDetail.startTime} - {selectedAptDetail.endTime}
                </div>
              </div>

              {selectedAptDetail.reason && (
                <div>
                  <span className="small text-muted text-uppercase fw-semibold d-block mb-1">
                    Reason for Visit
                  </span>
                  <p className="small mb-0 text-dark">{selectedAptDetail.reason}</p>
                </div>
              )}

              {selectedAptDetail.notes && (
                <div>
                  <span className="small text-muted text-uppercase fw-semibold d-block mb-1">
                    Internal Notes
                  </span>
                  <p className="small mb-0 text-secondary bg-light p-2 rounded border">
                    {selectedAptDetail.notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Cancel Confirmation Modal */}
      <Modal show={showCancelModal} onHide={() => setShowCancelModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="h5 fw-bold text-danger">Cancel Appointment</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCancelSubmit}>
          <Modal.Body className="p-4">
            <p>
              Are you sure you want to cancel appointment{' '}
              <strong className="font-monospace text-danger">{aptToCancel?.appointmentCode}</strong>?
            </p>
            <Form.Group>
              <Form.Label className="small fw-semibold text-muted">CANCELLATION REASON</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                placeholder="Reason for cancellation..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setShowCancelModal(false)}>
              Keep Appointment
            </Button>
            <Button variant="danger" type="submit" disabled={cancelSubmitting}>
              {cancelSubmitting ? 'Cancelling...' : 'Confirm Cancellation'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default AppointmentsPage;
