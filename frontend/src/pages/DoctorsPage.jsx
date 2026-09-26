import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  InputGroup,
  Modal,
  Alert,
  Badge,
} from 'react-bootstrap';
import {
  getDoctors,
  getSpecializations,
  createDoctor,
  updateDoctor,
  toggleDoctorStatus,
  getDoctorById,
} from '../services/doctorService';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatusBadge from '../components/common/StatusBadge';

const DoctorsPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  // State
  const [doctors, setDoctors] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [selectedSpec, setSelectedSpec] = useState('');
  const [activeFilter, setActiveFilter] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('CREATE'); // 'CREATE' | 'EDIT'
  const [selectedDoctorId, setSelectedDoctorId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    specialization: '',
    qualification: '',
    experienceYears: '',
    licenseNumber: '',
    consultationFee: '',
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Schedules View Modal
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [viewDoctorData, setViewDoctorData] = useState(null);
  const [scheduleLoading, setScheduleLoading] = useState(false);

  // Fetch Doctors and Specializations
  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [docRes, specRes] = await Promise.all([
        getDoctors({
          search,
          specialization: selectedSpec,
          isActive: activeFilter,
        }),
        getSpecializations(),
      ]);

      if (docRes.success) {
        setDoctors(docRes.data);
      }
      if (specRes.success) {
        setSpecializations(specRes.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch doctors');
    } finally {
      setLoading(false);
    }
  }, [search, selectedSpec, activeFilter]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  // Open Create Doctor Modal
  const handleOpenCreateModal = () => {
    setModalMode('CREATE');
    setSelectedDoctorId(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      phone: '',
      specialization: '',
      qualification: '',
      experienceYears: '5',
      licenseNumber: '',
      consultationFee: '500',
    });
    setFormError('');
    setShowModal(true);
  };

  // Open Edit Doctor Modal
  const handleOpenEditModal = (doc) => {
    setModalMode('EDIT');
    setSelectedDoctorId(doc._id);
    setFormData({
      name: doc.user?.name || '',
      email: doc.user?.email || '',
      password: '',
      phone: doc.user?.phone || '',
      specialization: doc.specialization || '',
      qualification: doc.qualification || '',
      experienceYears: String(doc.experienceYears || '0'),
      licenseNumber: doc.licenseNumber || '',
      consultationFee: String(doc.consultationFee || '0'),
    });
    setFormError('');
    setShowModal(true);
  };

  // View Schedules
  const handleViewSchedules = async (docId) => {
    setScheduleLoading(true);
    setShowScheduleModal(true);
    try {
      const res = await getDoctorById(docId);
      if (res.success) {
        setViewDoctorData(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load doctor schedules');
      setShowScheduleModal(false);
    } finally {
      setScheduleLoading(false);
    }
  };

  // Save Doctor
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name || !formData.specialization || !formData.qualification || !formData.consultationFee) {
      setFormError('Please fill in all required fields.');
      return;
    }

    if (modalMode === 'CREATE' && (!formData.email || !formData.password || !formData.licenseNumber)) {
      setFormError('Email, password, and medical license number are required for new accounts.');
      return;
    }

    setSubmitting(true);
    try {
      if (modalMode === 'CREATE') {
        const res = await createDoctor(formData);
        setSuccessMsg(`Doctor ${res.data.user.name} registered successfully!`);
      } else {
        const res = await updateDoctor(selectedDoctorId, formData);
        setSuccessMsg(`Doctor ${res.data.user.name} profile updated successfully!`);
      }

      setShowModal(false);
      fetchDoctors();
    } catch (err) {
      setFormError(err.message || 'Operation failed. Please verify inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Doctor Active Status
  const handleToggleStatus = async (doc) => {
    const actionName = doc.isActive ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${actionName} doctor ${doc.user?.name}?`)) {
      return;
    }

    try {
      await toggleDoctorStatus(doc._id, !doc.isActive);
      setSuccessMsg(`Doctor status updated successfully.`);
      fetchDoctors();
    } catch (err) {
      setError(err.message || 'Failed to update doctor status');
    }
  };

  return (
    <Container className="py-4">
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-2 border-bottom">
        <div>
          <h2 className="fw-bold mb-1 d-flex align-items-center gap-2">
            <i className="bi bi-person-badge text-primary"></i> Doctors Directory
          </h2>
          <p className="text-muted mb-0">Browse medical specialists, consultation fees, and clinical timings.</p>
        </div>
        {isAdmin && (
          <div className="mt-2 mt-md-0">
            <Button variant="primary" onClick={handleOpenCreateModal} className="d-flex align-items-center gap-2">
              <i className="bi bi-person-plus-fill"></i> Add New Doctor
            </Button>
          </div>
        )}
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

      {/* Search & Specialty Filters */}
      <Card className="clinic-card border-0 shadow-sm mb-4">
        <Card.Body className="p-3">
          <Row className="g-2 align-items-center">
            <Col lg={5} md={6}>
              <InputGroup size="sm">
                <InputGroup.Text><i className="bi bi-search"></i></InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search doctor by name, qualification, license..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </InputGroup>
            </Col>

            <Col lg={3} sm={6}>
              <Form.Select
                size="sm"
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value)}
              >
                <option value="">All Statuses (Active & Inactive)</option>
                <option value="true">Active Specialists Only</option>
                <option value="false">Inactive Specialists Only</option>
              </Form.Select>
            </Col>

            <Col lg={4} className="text-end">
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setSelectedSpec('');
                  setActiveFilter('');
                }}
              >
                <i className="bi bi-arrow-counterclockwise me-1"></i> Reset Filters
              </Button>
            </Col>
          </Row>

          {/* Specialty Pill Quick Filters */}
          <div className="d-flex flex-wrap gap-2 mt-3 pt-3 border-top">
            <Button
              variant={selectedSpec === '' ? 'primary' : 'outline-secondary'}
              size="sm"
              className="rounded-pill px-3 py-1"
              onClick={() => setSelectedSpec('')}
            >
              All Specialties
            </Button>
            {specializations.map((spec) => (
              <Button
                key={spec}
                variant={selectedSpec === spec ? 'primary' : 'outline-secondary'}
                size="sm"
                className="rounded-pill px-3 py-1"
                onClick={() => setSelectedSpec(spec)}
              >
                {spec}
              </Button>
            ))}
          </div>
        </Card.Body>
      </Card>

      {/* Doctors Grid */}
      {loading ? (
        <LoadingSpinner message="Loading doctors directory..." />
      ) : doctors.length === 0 ? (
        <div className="text-center py-5 text-muted bg-white rounded border">
          <i className="bi bi-person-x display-4 d-block mb-2"></i>
          No medical specialists match your search criteria.
        </div>
      ) : (
        <Row className="g-4">
          {doctors.map((doc) => (
            <Col key={doc._id} md={6} lg={4}>
              <Card className="clinic-card border-0 shadow-sm h-100 position-relative">
                <Card.Body className="p-4 d-flex flex-column">
                  {/* Top Bar with Status and Specialty */}
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Badge bg="primary-subtle" text="primary" className="border border-primary-subtle px-2 py-1">
                      {doc.specialization}
                    </Badge>
                    <StatusBadge status={doc.isActive ? 'ACTIVE' : 'INACTIVE'} />
                  </div>

                  {/* Doctor Info */}
                  <div className="d-flex align-items-center gap-3 mb-3">
                    <div className="d-flex align-items-center justify-content-center bg-light text-primary rounded-circle border" style={{ width: '56px', height: '56px' }}>
                      <i className="bi bi-stethoscope fs-3"></i>
                    </div>
                    <div>
                      <h5 className="fw-bold mb-0 text-dark">{doc.user?.name || 'Doctor'}</h5>
                      <div className="small text-muted">{doc.qualification}</div>
                    </div>
                  </div>

                  {/* Key Stats */}
                  <div className="bg-light p-3 rounded mb-3 small flex-grow-1">
                    <div className="d-flex justify-content-between mb-1">
                      <span className="text-muted">Experience:</span>
                      <strong>{doc.experienceYears} Years</strong>
                    </div>
                    <div className="d-flex justify-content-between mb-1">
                      <span className="text-muted">Medical License:</span>
                      <span className="font-monospace fw-semibold">{doc.licenseNumber}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-1">
                      <span className="text-muted">Contact:</span>
                      <span>{doc.user?.phone || 'N/A'}</span>
                    </div>
                    <div className="d-flex justify-content-between border-top pt-1 mt-1 text-primary">
                      <span className="fw-semibold">Consultation Fee:</span>
                      <strong className="fs-6">₹{doc.consultationFee}</strong>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="d-flex gap-2">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="flex-grow-1 d-flex align-items-center justify-content-center gap-1"
                      onClick={() => handleViewSchedules(doc._id)}
                    >
                      <i className="bi bi-calendar-week"></i> View Timings
                    </Button>

                    {isAdmin && (
                      <>
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          title="Edit Profile"
                          onClick={() => handleOpenEditModal(doc)}
                        >
                          <i className="bi bi-pencil"></i>
                        </Button>
                        <Button
                          variant={doc.isActive ? 'outline-warning' : 'outline-success'}
                          size="sm"
                          title={doc.isActive ? 'Deactivate Doctor' : 'Activate Doctor'}
                          onClick={() => handleToggleStatus(doc)}
                        >
                          <i className={`bi ${doc.isActive ? 'bi-person-slash' : 'bi-person-check'}`}></i>
                        </Button>
                      </>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Doctor Schedules Modal */}
      <Modal show={showScheduleModal} onHide={() => setShowScheduleModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold fs-5">
            <i className="bi bi-clock-history text-primary me-2"></i>
            Clinical Timings & Weekly Slots
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {scheduleLoading || !viewDoctorData ? (
            <LoadingSpinner message="Retrieving doctor schedules..." />
          ) : (
            <div>
              <div className="d-flex align-items-center gap-3 p-3 bg-light rounded mb-4">
                <i className="bi bi-person-circle fs-1 text-primary"></i>
                <div>
                  <h5 className="fw-bold mb-0">{viewDoctorData.doctor?.user?.name}</h5>
                  <div className="text-muted small">
                    {viewDoctorData.doctor?.specialization} &bull; Fee: ₹{viewDoctorData.doctor?.consultationFee}
                  </div>
                </div>
              </div>

              <h6 className="fw-bold mb-2">Configured Weekly Availability</h6>
              {viewDoctorData.schedules.length === 0 ? (
                <div className="text-muted small py-3">No active schedules configured for this doctor.</div>
              ) : (
                <div className="d-flex flex-wrap gap-2">
                  {viewDoctorData.schedules.map((sched) => (
                    <div key={sched._id} className="p-2 border rounded bg-white small" style={{ minWidth: '160px' }}>
                      <strong className="text-primary d-block">{sched.dayOfWeek}</strong>
                      <span className="text-dark fw-medium">{sched.startTime} - {sched.endTime}</span>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                        Slot: {sched.slotDuration} mins
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" size="sm" onClick={() => setShowScheduleModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Add / Edit Doctor Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
        <Form onSubmit={handleFormSubmit}>
          <Modal.Header closeButton>
            <Modal.Title className="fw-bold fs-5">
              <i className={`bi ${modalMode === 'CREATE' ? 'bi-person-plus' : 'bi-pencil'} text-primary me-2`}></i>
              {modalMode === 'CREATE' ? 'Add New Medical Specialist' : 'Edit Doctor Profile'}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-4">
            {formError && (
              <Alert variant="danger" className="py-2 small">
                <i className="bi bi-exclamation-triangle-fill me-2"></i> {formError}
              </Alert>
            )}

            <Row className="g-3">
              <Col md={6}>
                <Form.Group controlId="docName">
                  <Form.Label className="small fw-semibold">Full Name *</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g. Dr. Ramesh Gupta"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group controlId="docSpecialization">
                  <Form.Label className="small fw-semibold">Specialization *</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g. Cardiology, Dermatology, Pediatrics..."
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>

              {modalMode === 'CREATE' && (
                <>
                  <Col md={6}>
                    <Form.Group controlId="docEmail">
                      <Form.Label className="small fw-semibold">Email (Login Username) *</Form.Label>
                      <Form.Control
                        type="email"
                        placeholder="doctor@clinic.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group controlId="docPassword">
                      <Form.Label className="small fw-semibold">Initial Password *</Form.Label>
                      <Form.Control
                        type="password"
                        placeholder="At least 6 characters"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                      />
                    </Form.Group>
                  </Col>
                </>
              )}

              <Col md={4}>
                <Form.Group controlId="docPhone">
                  <Form.Label className="small fw-semibold">Contact Phone</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="+91 98XXX XXXXX"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group controlId="docExperience">
                  <Form.Label className="small fw-semibold">Experience (Years) *</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    value={formData.experienceYears}
                    onChange={(e) => setFormData({ ...formData, experienceYears: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group controlId="docFee">
                  <Form.Label className="small fw-semibold">Consultation Fee (₹) *</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    step="50"
                    placeholder="500"
                    value={formData.consultationFee}
                    onChange={(e) => setFormData({ ...formData, consultationFee: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group controlId="docQualification">
                  <Form.Label className="small fw-semibold">Qualifications *</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g. MBBS, MD, DM"
                    value={formData.qualification}
                    onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group controlId="docLicense">
                  <Form.Label className="small fw-semibold">Medical License Number *</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g. MCI-CARD-2026-999"
                    value={formData.licenseNumber}
                    onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                    required
                    disabled={modalMode === 'EDIT'}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setShowModal(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : modalMode === 'CREATE' ? 'Register Doctor' : 'Save Changes'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default DoctorsPage;
