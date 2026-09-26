import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Button,
  Form,
  InputGroup,
  Modal,
  Alert,
  Pagination,
  Badge,
} from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { getPatients, createPatient, updatePatient, togglePatientStatus } from '../services/patientService';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatusBadge from '../components/common/StatusBadge';

const PatientsPage = () => {
  const { user } = useAuth();
  const isReceptionistOrAdmin = user?.role === 'ADMIN' || user?.role === 'RECEPTIONIST';
  const isAdmin = user?.role === 'ADMIN';

  // State
  const [patients, setPatients] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [bloodGroupFilter, setBloodGroupFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('CREATE'); // 'CREATE' | 'EDIT'
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    dateOfBirth: '',
    gender: 'MALE',
    bloodGroup: 'UNKNOWN',
    phone: '',
    email: '',
    address: '',
    emergencyName: '',
    emergencyRelationship: '',
    emergencyPhone: '',
    medicalNotes: '',
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch Patients
  const fetchPatients = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getPatients({
        page,
        limit: 10,
        search,
        gender: genderFilter,
        bloodGroup: bloodGroupFilter,
        isActive: activeFilter,
      });

      if (response.success) {
        setPatients(response.data);
        if (response.pagination) {
          setPagination(response.pagination);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch patients list');
    } finally {
      setLoading(false);
    }
  }, [search, genderFilter, bloodGroupFilter, activeFilter]);

  useEffect(() => {
    fetchPatients(1);
  }, [fetchPatients]);

  // Handle Search Input Submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchPatients(1);
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setModalMode('CREATE');
    setSelectedPatientId(null);
    setFormData({
      name: '',
      dateOfBirth: '',
      gender: 'MALE',
      bloodGroup: 'UNKNOWN',
      phone: '',
      email: '',
      address: '',
      emergencyName: '',
      emergencyRelationship: '',
      emergencyPhone: '',
      medicalNotes: '',
    });
    setFormError('');
    setShowModal(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (patient) => {
    setModalMode('EDIT');
    setSelectedPatientId(patient._id);
    const dobString = patient.dateOfBirth ? new Date(patient.dateOfBirth).toISOString().split('T')[0] : '';
    setFormData({
      name: patient.name || '',
      dateOfBirth: dobString,
      gender: patient.gender || 'MALE',
      bloodGroup: patient.bloodGroup || 'UNKNOWN',
      phone: patient.phone || '',
      email: patient.email || '',
      address: patient.address || '',
      emergencyName: patient.emergencyContact?.name || '',
      emergencyRelationship: patient.emergencyContact?.relationship || '',
      emergencyPhone: patient.emergencyContact?.phone || '',
      medicalNotes: patient.medicalNotes || '',
    });
    setFormError('');
    setShowModal(true);
  };

  // Save Patient
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name || !formData.dateOfBirth || !formData.phone) {
      setFormError('Please fill in required fields: Name, Date of Birth, and Phone.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: formData.name,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        bloodGroup: formData.bloodGroup,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        emergencyContact: {
          name: formData.emergencyName,
          relationship: formData.emergencyRelationship,
          phone: formData.emergencyPhone,
        },
        medicalNotes: formData.medicalNotes,
      };

      if (modalMode === 'CREATE') {
        const res = await createPatient(payload);
        setSuccessMsg(`Patient ${res.data.name} (${res.data.patientCode}) registered successfully!`);
      } else {
        const res = await updatePatient(selectedPatientId, payload);
        setSuccessMsg(`Patient ${res.data.name} updated successfully!`);
      }

      setShowModal(false);
      fetchPatients(pagination.page);
    } catch (err) {
      setFormError(err.message || 'Operation failed. Please verify inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Patient Status
  const handleToggleStatus = async (patient) => {
    const actionName = patient.isActive ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${actionName} patient ${patient.name}?`)) {
      return;
    }

    try {
      await togglePatientStatus(patient._id, !patient.isActive);
      setSuccessMsg(`Patient status updated successfully.`);
      fetchPatients(pagination.page);
    } catch (err) {
      setError(err.message || 'Failed to update patient status');
    }
  };

  return (
    <Container className="py-4">
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-2 border-bottom">
        <div>
          <h2 className="fw-bold mb-1 d-flex align-items-center gap-2">
            <i className="bi bi-people text-primary"></i> Patient Management
          </h2>
          <p className="text-muted mb-0">Search, register, and review comprehensive patient profiles.</p>
        </div>
        {isReceptionistOrAdmin && (
          <div className="mt-2 mt-md-0">
            <Button variant="primary" onClick={handleOpenCreateModal} className="d-flex align-items-center gap-2">
              <i className="bi bi-person-plus-fill"></i> Register New Patient
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

      {/* Search & Filter Toolbar */}
      <Card className="clinic-card border-0 shadow-sm mb-4">
        <Card.Body className="p-3">
          <Form onSubmit={handleSearchSubmit}>
            <Row className="g-2">
              <Col lg={4} md={6}>
                <InputGroup size="sm">
                  <InputGroup.Text><i className="bi bi-search"></i></InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Search by name, phone, code..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <Button variant="outline-primary" type="submit">Search</Button>
                </InputGroup>
              </Col>

              <Col lg={2} sm={4}>
                <Form.Select
                  size="sm"
                  value={genderFilter}
                  onChange={(e) => setGenderFilter(e.target.value)}
                >
                  <option value="">All Genders</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </Form.Select>
              </Col>

              <Col lg={2} sm={4}>
                <Form.Select
                  size="sm"
                  value={bloodGroupFilter}
                  onChange={(e) => setBloodGroupFilter(e.target.value)}
                >
                  <option value="">All Blood Groups</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </Form.Select>
              </Col>

              <Col lg={2} sm={4}>
                <Form.Select
                  size="sm"
                  value={activeFilter}
                  onChange={(e) => setActiveFilter(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="true">Active Only</option>
                  <option value="false">Inactive Only</option>
                </Form.Select>
              </Col>

              <Col lg={2} className="text-end">
                <Button
                  variant="outline-secondary"
                  size="sm"
                  className="w-100"
                  onClick={() => {
                    setSearch('');
                    setGenderFilter('');
                    setBloodGroupFilter('');
                    setActiveFilter('');
                  }}
                >
                  <i className="bi bi-arrow-counterclockwise me-1"></i> Reset
                </Button>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>

      {/* Patients Data Table */}
      <Card className="clinic-card border-0 shadow-sm">
        <div className="clinic-card-header d-flex justify-content-between align-items-center">
          <span>Registered Patients Directory</span>
          <span className="badge bg-light text-dark border">
            Total: {pagination.total}
          </span>
        </div>
        <Card.Body className="p-0">
          {loading ? (
            <LoadingSpinner message="Loading patients directory..." />
          ) : patients.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-people display-4 d-block mb-2"></i>
              No patients found matching the selected filter criteria.
            </div>
          ) : (
            <Table hover responsive className="mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th>Code</th>
                  <th>Patient Name</th>
                  <th>Gender / Age</th>
                  <th>Blood Group</th>
                  <th>Contact</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((patient) => {
                  const birthDate = new Date(patient.dateOfBirth);
                  const age = Math.floor((new Date() - birthDate) / (365.25 * 24 * 60 * 60 * 1000));

                  return (
                    <tr key={patient._id}>
                      <td>
                        <Badge bg="secondary-subtle" text="dark" className="border font-monospace">
                          {patient.patientCode}
                        </Badge>
                      </td>
                      <td>
                        <Link to={`/patients/${patient._id}`} className="fw-semibold text-decoration-none text-primary">
                          {patient.name}
                        </Link>
                        {patient.address && (
                          <div className="small text-muted text-truncate" style={{ maxWidth: '200px' }}>
                            {patient.address}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className="small">
                          {patient.gender} &bull; {isNaN(age) ? 'N/A' : `${age} yrs`}
                        </span>
                      </td>
                      <td>
                        <Badge bg="danger-subtle" text="danger" className="border border-danger-subtle">
                          {patient.bloodGroup}
                        </Badge>
                      </td>
                      <td>
                        <div className="small fw-medium">{patient.phone}</div>
                        {patient.email && <div className="small text-muted">{patient.email}</div>}
                      </td>
                      <td>
                        <StatusBadge status={patient.isActive ? 'ACTIVE' : 'INACTIVE'} />
                      </td>
                      <td className="text-end">
                        <div className="d-flex justify-content-end gap-1">
                          <Button
                            as={Link}
                            to={`/patients/${patient._id}`}
                            variant="outline-primary"
                            size="sm"
                            title="View Clinical Dossier"
                          >
                            <i className="bi bi-folder2-open"></i>
                          </Button>

                          {isReceptionistOrAdmin && (
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              title="Edit Patient"
                              onClick={() => handleOpenEditModal(patient)}
                            >
                              <i className="bi bi-pencil"></i>
                            </Button>
                          )}

                          {isAdmin && (
                            <Button
                              variant={patient.isActive ? 'outline-warning' : 'outline-success'}
                              size="sm"
                              title={patient.isActive ? 'Deactivate Patient' : 'Activate Patient'}
                              onClick={() => handleToggleStatus(patient)}
                            >
                              <i className={`bi ${patient.isActive ? 'bi-person-slash' : 'bi-person-check'}`}></i>
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </Card.Body>

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <Card.Footer className="bg-white border-top d-flex justify-content-between align-items-center py-2">
            <span className="small text-muted">
              Showing page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong> ({pagination.total} patients)
            </span>
            <Pagination size="sm" className="mb-0">
              <Pagination.Prev
                disabled={pagination.page <= 1}
                onClick={() => fetchPatients(pagination.page - 1)}
              />
              {[...Array(pagination.totalPages)].map((_, idx) => {
                const pageNum = idx + 1;
                // Show only nearby pages if total pages is large
                if (
                  pageNum === 1 ||
                  pageNum === pagination.totalPages ||
                  (pageNum >= pagination.page - 2 && pageNum <= pagination.page + 2)
                ) {
                  return (
                    <Pagination.Item
                      key={pageNum}
                      active={pageNum === pagination.page}
                      onClick={() => fetchPatients(pageNum)}
                    >
                      {pageNum}
                    </Pagination.Item>
                  );
                }
                return null;
              })}
              <Pagination.Next
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchPatients(pagination.page + 1)}
              />
            </Pagination>
          </Card.Footer>
        )}
      </Card>

      {/* Patient Create / Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
        <Form onSubmit={handleFormSubmit}>
          <Modal.Header closeButton>
            <Modal.Title className="fw-bold fs-5">
              <i className={`bi ${modalMode === 'CREATE' ? 'bi-person-plus' : 'bi-pencil'} text-primary me-2`}></i>
              {modalMode === 'CREATE' ? 'Register New Patient' : 'Edit Patient Information'}
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
                <Form.Group controlId="patientName">
                  <Form.Label className="small fw-semibold">Full Name *</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter patient full name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>

              <Col md={3}>
                <Form.Group controlId="patientDOB">
                  <Form.Label className="small fw-semibold">Date of Birth *</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>

              <Col md={3}>
                <Form.Group controlId="patientGender">
                  <Form.Label className="small fw-semibold">Gender *</Form.Label>
                  <Form.Select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    required
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group controlId="patientPhone">
                  <Form.Label className="small fw-semibold">Phone Number *</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="+91 98XXX XXXXX"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group controlId="patientEmail">
                  <Form.Label className="small fw-semibold">Email Address</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="patient@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group controlId="patientBloodGroup">
                  <Form.Label className="small fw-semibold">Blood Group</Form.Label>
                  <Form.Select
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                  >
                    <option value="UNKNOWN">Unknown</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Group controlId="patientAddress">
                  <Form.Label className="small fw-semibold">Residential Address</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter locality, street, city"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </Form.Group>
              </Col>

              <Col md={12}>
                <div className="p-3 bg-light rounded border">
                  <div className="fw-semibold small text-primary mb-2">Emergency Contact Details</div>
                  <Row className="g-2">
                    <Col md={4}>
                      <Form.Control
                        size="sm"
                        placeholder="Contact Name"
                        value={formData.emergencyName}
                        onChange={(e) => setFormData({ ...formData, emergencyName: e.target.value })}
                      />
                    </Col>
                    <Col md={4}>
                      <Form.Control
                        size="sm"
                        placeholder="Relationship (e.g. Spouse)"
                        value={formData.emergencyRelationship}
                        onChange={(e) => setFormData({ ...formData, emergencyRelationship: e.target.value })}
                      />
                    </Col>
                    <Col md={4}>
                      <Form.Control
                        size="sm"
                        placeholder="Emergency Phone"
                        value={formData.emergencyPhone}
                        onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                      />
                    </Col>
                  </Row>
                </div>
              </Col>

              <Col md={12}>
                <Form.Group controlId="patientNotes">
                  <Form.Label className="small fw-semibold">Clinical & Medical Notes</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    placeholder="Existing conditions, allergies, or baseline medications..."
                    value={formData.medicalNotes}
                    onChange={(e) => setFormData({ ...formData, medicalNotes: e.target.value })}
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
              {submitting ? 'Saving...' : modalMode === 'CREATE' ? 'Register Patient' : 'Save Changes'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default PatientsPage;
