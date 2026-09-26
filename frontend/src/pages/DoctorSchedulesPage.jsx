import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  Modal,
  Alert,
  Badge,
} from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { getDoctors } from '../services/doctorService';
import {
  getDoctorSchedules,
  createDoctorSchedule,
  deleteSchedule,
  getAvailableSlots,
} from '../services/scheduleService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import TimeSlotSelector from '../components/schedules/TimeSlotSelector';

const DAYS_OF_WEEK = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

const DoctorSchedulesPage = () => {
  const { user, doctor: currentDoctor } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  // Selected Doctor
  const [doctorsList, setDoctorsList] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState(
    currentDoctor ? currentDoctor._id : ''
  );

  // Schedules state
  const [doctorInfo, setDoctorInfo] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Add Schedule Modal
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    dayOfWeek: 'MONDAY',
    startTime: '09:00',
    endTime: '13:00',
    slotDuration: '30',
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Available Slots Simulator State
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const [simDate, setSimDate] = useState(tomorrowStr);
  const [simSlots, setSimSlots] = useState([]);
  const [simDayOfWeek, setSimDayOfWeek] = useState('');
  const [simLoading, setSimLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Fetch doctors list for Admin dropdown
  useEffect(() => {
    const fetchDoctorsList = async () => {
      try {
        const res = await getDoctors({ limit: 100, isActive: 'true' });
        if (res.success && res.data.length > 0) {
          setDoctorsList(res.data);
          if (!selectedDoctorId) {
            setSelectedDoctorId(res.data[0]._id);
          }
        }
      } catch (err) {
        console.error('Failed to fetch doctors list', err);
      }
    };

    fetchDoctorsList();
  }, [selectedDoctorId]);

  // Fetch schedules for the selected doctor
  const fetchSchedules = useCallback(async () => {
    if (!selectedDoctorId) return;

    setLoading(true);
    setError(null);
    try {
      const res = await getDoctorSchedules(selectedDoctorId);
      if (res.success) {
        setDoctorInfo(res.data.doctor);
        setSchedules(res.data.schedules);
      }
    } catch (err) {
      setError(err.message || 'Failed to load doctor schedules');
    } finally {
      setLoading(false);
    }
  }, [selectedDoctorId]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  // Fetch dynamic available slots for simulator
  const fetchSimSlots = useCallback(async () => {
    if (!selectedDoctorId || !simDate) return;

    setSimLoading(true);
    try {
      const res = await getAvailableSlots(selectedDoctorId, simDate);
      if (res.success && res.data) {
        setSimSlots(res.data.slots || []);
        setSimDayOfWeek(res.data.dayOfWeek || '');
        setSelectedSlot(null);
      }
    } catch (err) {
      console.warn('Error fetching simulator slots', err);
      setSimSlots([]);
    } finally {
      setSimLoading(false);
    }
  }, [selectedDoctorId, simDate]);

  useEffect(() => {
    fetchSimSlots();
  }, [fetchSimSlots]);

  // Handle Add Schedule Submit
  const handleAddSchedule = async (e) => {
    e.preventDefault();
    setFormError('');

    if (formData.startTime >= formData.endTime) {
      setFormError('Start time must be strictly before end time.');
      return;
    }

    setSubmitting(true);
    try {
      await createDoctorSchedule(selectedDoctorId, formData);
      setSuccessMsg(`Schedule block added for ${formData.dayOfWeek}!`);
      setShowModal(false);
      fetchSchedules();
      fetchSimSlots();
    } catch (err) {
      setFormError(err.message || 'Failed to create schedule block');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete Schedule
  const handleDeleteSchedule = async (schedId, day) => {
    if (!window.confirm(`Are you sure you want to delete this schedule block for ${day}?`)) {
      return;
    }

    try {
      await deleteSchedule(schedId);
      setSuccessMsg(`Schedule block deleted successfully.`);
      fetchSchedules();
      fetchSimSlots();
    } catch (err) {
      setError(err.message || 'Failed to delete schedule block');
    }
  };

  // Group schedules by day of week
  const schedulesByDay = DAYS_OF_WEEK.reduce((acc, day) => {
    acc[day] = schedules.filter((s) => s.dayOfWeek === day);
    return acc;
  }, {});

  return (
    <Container className="py-4">
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-2 border-bottom">
        <div>
          <h2 className="fw-bold mb-1 d-flex align-items-center gap-2">
            <i className="bi bi-calendar-range text-primary"></i> Doctor Schedules & Timings
          </h2>
          <p className="text-muted mb-0">Configure clinical operating hours and test dynamic slot computation.</p>
        </div>
        <div>
          <Button
            variant="primary"
            onClick={() => {
              setFormError('');
              setShowModal(true);
            }}
            className="d-flex align-items-center gap-2"
          >
            <i className="bi bi-plus-circle"></i> Add Schedule Block
          </Button>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <Alert variant="success" dismissible onClose={() => setSuccessMsg('')} className="py-2 small">
          <i className="bi bi-check-circle-fill me-2"></i> {successMsg}
        </Alert>
      )}

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)} className="py-2 small">
          <i className="bi bi-exclamation-triangle-fill me-2"></i> {error}
        </Alert>
      )}

      {/* Doctor Selector for Admins */}
      {isAdmin && doctorsList.length > 0 && (
        <Card className="clinic-card border-0 shadow-sm mb-4">
          <Card.Body className="p-3">
            <Row className="align-items-center">
              <Col md={3}>
                <Form.Label className="small fw-bold text-muted mb-0">
                  <i className="bi bi-person-badge text-primary me-1"></i> SELECT DOCTOR TO MANAGE:
                </Form.Label>
              </Col>
              <Col md={6}>
                <Form.Select
                  size="sm"
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                >
                  {doctorsList.map((doc) => (
                    <option key={doc._id} value={doc._id}>
                      {doc.user?.name} — {doc.specialization} (Fee: ₹{doc.consultationFee})
                    </option>
                  ))}
                </Form.Select>
              </Col>
              <Col md={3} className="text-muted small">
                Showing schedule for: <strong>{doctorInfo?.name || 'Selected Doctor'}</strong>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}

      <Row className="g-4">
        {/* Weekly Schedule Overview */}
        <Col lg={7}>
          <Card className="clinic-card border-0 shadow-sm h-100">
            <div className="clinic-card-header d-flex justify-content-between align-items-center">
              <span>Weekly Schedule Roster</span>
              <Badge bg="primary" pill>
                {schedules.length} Active Blocks
              </Badge>
            </div>
            <Card.Body>
              {loading ? (
                <LoadingSpinner message="Loading doctor schedule blocks..." />
              ) : (
                <div className="d-flex flex-column gap-3">
                  {DAYS_OF_WEEK.map((day) => {
                    const daySchedules = schedulesByDay[day] || [];
                    const isToday = DAYS_OF_WEEK[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1] === day;

                    return (
                      <div
                        key={day}
                        className={`p-3 border rounded ${isToday ? 'bg-primary-subtle border-primary-subtle' : 'bg-light'}`}
                      >
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <strong className="text-dark small">
                            {day} {isToday && <Badge bg="primary" className="ms-1 small">Today</Badge>}
                          </strong>
                          <span className="small text-muted">
                            {daySchedules.length === 0 ? 'No clinics' : `${daySchedules.length} Session(s)`}
                          </span>
                        </div>

                        {daySchedules.length === 0 ? (
                          <div className="text-muted small fst-italic">Off duty &bull; Not available</div>
                        ) : (
                          <div className="d-flex flex-wrap gap-2">
                            {daySchedules.map((sched) => (
                              <div
                                key={sched._id}
                                className="d-flex align-items-center gap-2 px-2 py-1 bg-white border rounded small shadow-sm"
                              >
                                <i className="bi bi-clock text-primary"></i>
                                <span className="font-monospace fw-semibold">
                                  {sched.startTime} - {sched.endTime}
                                </span>
                                <Badge bg="light" text="dark" className="border">
                                  {sched.slotDuration}m
                                </Badge>
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="text-danger p-0 ms-1"
                                  title="Delete Block"
                                  onClick={() => handleDeleteSchedule(sched._id, sched.dayOfWeek)}
                                >
                                  <i className="bi bi-trash"></i>
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Section 15: Live Dynamic Available Slots Visualizer */}
        <Col lg={5}>
          <Card className="clinic-card border-0 shadow-sm h-100">
            <div className="clinic-card-header d-flex justify-content-between align-items-center">
              <span>Section 15: Available Slots Visualizer</span>
              <Badge bg="success">Live Engine</Badge>
            </div>
            <Card.Body>
              <p className="text-muted small mb-3">
                Calculates real-time availability by dividing active doctor schedules into discrete interval slots and flagging existing appointment conflicts.
              </p>

              {/* Date Input */}
              <Form.Group className="mb-3" controlId="simulatorDate">
                <Form.Label className="small fw-semibold text-muted">Pick Target Date</Form.Label>
                <div className="d-flex gap-2">
                  <Form.Control
                    type="date"
                    size="sm"
                    value={simDate}
                    onChange={(e) => setSimDate(e.target.value)}
                  />
                  <Button variant="outline-primary" size="sm" onClick={fetchSimSlots}>
                    Compute
                  </Button>
                </div>
                {simDayOfWeek && (
                  <div className="small text-muted mt-1">
                    Day: <strong>{simDayOfWeek}</strong> &bull; Total Computed: <strong>{simSlots.length}</strong> slots
                  </div>
                )}
              </Form.Group>

              {/* Render Reusable TimeSlotSelector */}
              <div className="border rounded p-3 bg-white">
                <TimeSlotSelector
                  slots={simSlots}
                  selectedSlot={selectedSlot}
                  onSelectSlot={(slot) => setSelectedSlot(slot)}
                  loading={simLoading}
                />

                {selectedSlot && (
                  <div className="mt-3 p-2 bg-success-subtle text-success border border-success-subtle rounded small d-flex justify-content-between align-items-center">
                    <span>
                      Selected: <strong>{selectedSlot.startTime} - {selectedSlot.endTime}</strong>
                    </span>
                    <Badge bg="success">Ready for Booking</Badge>
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Add Schedule Block Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Form onSubmit={handleAddSchedule}>
          <Modal.Header closeButton>
            <Modal.Title className="fw-bold fs-5">
              <i className="bi bi-calendar-plus text-primary me-2"></i> Add Schedule Block
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-4">
            {formError && (
              <Alert variant="danger" className="py-2 small">
                <i className="bi bi-exclamation-triangle-fill me-2"></i> {formError}
              </Alert>
            )}

            <Form.Group className="mb-3" controlId="schedDay">
              <Form.Label className="small fw-semibold">Day of the Week *</Form.Label>
              <Form.Select
                value={formData.dayOfWeek}
                onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value })}
                required
              >
                {DAYS_OF_WEEK.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Row className="g-2 mb-3">
              <Col xs={6}>
                <Form.Group controlId="schedStart">
                  <Form.Label className="small fw-semibold">Start Time (HH:mm) *</Form.Label>
                  <Form.Control
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col xs={6}>
                <Form.Group controlId="schedEnd">
                  <Form.Label className="small fw-semibold">End Time (HH:mm) *</Form.Label>
                  <Form.Control
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3" controlId="schedDuration">
              <Form.Label className="small fw-semibold">Slot Duration (Minutes) *</Form.Label>
              <Form.Select
                value={formData.slotDuration}
                onChange={(e) => setFormData({ ...formData, slotDuration: e.target.value })}
                required
              >
                <option value="15">15 Minutes</option>
                <option value="20">20 Minutes</option>
                <option value="30">30 Minutes (Standard)</option>
                <option value="45">45 Minutes</option>
                <option value="60">60 Minutes</option>
              </Form.Select>
            </Form.Group>

            <div className="p-2 bg-light rounded text-muted small">
              <i className="bi bi-info-circle me-1"></i> Backend automatically prevents overlapping intervals for the same doctor.
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setShowModal(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? 'Adding...' : 'Add Schedule Block'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default DoctorSchedulesPage;
