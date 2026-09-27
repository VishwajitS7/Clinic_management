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
import prescriptionService from '../services/prescriptionService';
import consultationService from '../services/consultationService';
import doctorService from '../services/doctorService';
import { useAuth } from '../context/AuthContext';

const PrescriptionsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paramConsultationId = searchParams.get('consultationId');

  // Prescriptions State
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPrescriptions, setTotalPrescriptions] = useState(0);

  // Doctors list for filter
  const [doctorsList, setDoctorsList] = useState([]);

  // Consultations eligible for prescription (consultations without prescription)
  const [eligibleConsultations, setEligibleConsultations] = useState([]);

  // Create Prescription Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedConsultationId, setSelectedConsultationId] = useState('');
  const [medicineItems, setMedicineItems] = useState([
    {
      medicineName: '',
      dosage: '',
      frequency: 'Twice daily',
      duration: '5 days',
      route: 'Oral',
      instructions: 'Take after meals',
    },
  ]);
  const [generalInstructions, setGeneralInstructions] = useState('');
  const [createError, setCreateError] = useState('');
  const [createSubmitting, setCreateSubmitting] = useState(false);

  // Section 21: Printable Prescription Modal State
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);

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

  // Fetch eligible consultations
  const fetchEligibleConsultations = useCallback(async () => {
    try {
      const res = await consultationService.getConsultations({ limit: 100 });
      setEligibleConsultations(res.data || []);
    } catch (err) {
      console.error('Failed to fetch consultations:', err);
    }
  }, []);

  useEffect(() => {
    fetchEligibleConsultations();
  }, [fetchEligibleConsultations]);

  // If consultationId in URL param, auto-open creation modal
  useEffect(() => {
    if (paramConsultationId) {
      setSelectedConsultationId(paramConsultationId);
      setShowCreateModal(true);
    }
  }, [paramConsultationId]);

  // Fetch Prescriptions
  const fetchPrescriptions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: 10,
        search: search.trim() || undefined,
        doctorId: selectedDoctorFilter || undefined,
      };

      const res = await prescriptionService.getPrescriptions(params);
      setPrescriptions(res.data || []);
      if (res.pagination) {
        setTotalPages(res.pagination.totalPages || 1);
        setTotalPrescriptions(res.pagination.total || 0);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch prescriptions');
    } finally {
      setLoading(false);
    }
  }, [page, search, selectedDoctorFilter]);

  useEffect(() => {
    fetchPrescriptions();
  }, [fetchPrescriptions]);

  // Add / Remove medicine item row
  const addMedicineRow = () => {
    setMedicineItems([
      ...medicineItems,
      {
        medicineName: '',
        dosage: '',
        frequency: 'Twice daily',
        duration: '5 days',
        route: 'Oral',
        instructions: 'Take after meals',
      },
    ]);
  };

  const removeMedicineRow = (index) => {
    if (medicineItems.length <= 1) return;
    setMedicineItems(medicineItems.filter((_, i) => i !== index));
  };

  const updateMedicineField = (index, field, value) => {
    const updated = [...medicineItems];
    updated[index][field] = value;
    setMedicineItems(updated);
  };

  // Handle Create Prescription Submit
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedConsultationId) {
      setCreateError('Please select a clinical consultation');
      return;
    }

    // Validate medicines
    for (let i = 0; i < medicineItems.length; i++) {
      const item = medicineItems[i];
      if (!item.medicineName.trim()) {
        setCreateError(`Medicine #${i + 1}: Name is required`);
        return;
      }
      if (!item.dosage.trim()) {
        setCreateError(`Medicine #${i + 1}: Dosage is required (e.g. 500 mg)`);
        return;
      }
      if (!item.frequency.trim()) {
        setCreateError(`Medicine #${i + 1}: Frequency is required`);
        return;
      }
      if (!item.duration.trim()) {
        setCreateError(`Medicine #${i + 1}: Duration is required`);
        return;
      }
    }

    setCreateSubmitting(true);
    setCreateError('');

    try {
      await prescriptionService.createPrescription({
        consultationId: selectedConsultationId,
        items: medicineItems,
        instructions: generalInstructions.trim(),
      });

      setShowCreateModal(false);
      setSuccessMsg('Prescription issued successfully!');
      setTimeout(() => setSuccessMsg(''), 5000);
      // Reset form
      setSelectedConsultationId('');
      setMedicineItems([
        {
          medicineName: '',
          dosage: '',
          frequency: 'Twice daily',
          duration: '5 days',
          route: 'Oral',
          instructions: 'Take after meals',
        },
      ]);
      setGeneralInstructions('');
      fetchPrescriptions();
      fetchEligibleConsultations();
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Failed to issue prescription');
    } finally {
      setCreateSubmitting(false);
    }
  };

  // Open Printable Prescription Modal
  const openPrintModal = async (rxId) => {
    try {
      const res = await prescriptionService.getPrescriptionById(rxId);
      setSelectedPrescription(res.data);
      setShowPrintModal(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load prescription');
    }
  };

  return (
    <Container className="py-4">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1 d-flex align-items-center gap-2">
            <i className="bi bi-capsule text-primary"></i>
            Medical Prescriptions
          </h2>
          <p className="text-muted mb-0 small">
            Structured pharmaceutical orders, dosage regimens, and Section 21 printable Rx dossiers.
          </p>
        </div>
        {(user?.role === 'ADMIN' || user?.role === 'DOCTOR') && (
          <div>
            <Button
              variant="primary"
              className="d-flex align-items-center gap-2 shadow-sm"
              onClick={() => {
                setShowCreateModal(true);
                setCreateError('');
              }}
            >
              <i className="bi bi-plus-circle"></i>
              Issue Prescription
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
                  placeholder="Search by medicine name or instructions..."
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
                <option value="">All Prescribing Doctors</option>
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

      {/* Prescriptions Table */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Header className="bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
          <div className="fw-semibold">
            <i className="bi bi-journal-medical me-2 text-primary"></i>
            Prescription Records ({totalPrescriptions})
          </div>
          <Button variant="outline-secondary" size="sm" onClick={fetchPrescriptions} disabled={loading}>
            <i className={`bi bi-arrow-clockwise ${loading ? 'spin' : ''}`}></i> Refresh
          </Button>
        </Card.Header>
        <div className="table-responsive">
          <Table hover align="middle" className="mb-0">
            <thead className="table-light text-muted small text-uppercase">
              <tr>
                <th>Date</th>
                <th>Patient</th>
                <th>Prescribed By</th>
                <th>Diagnosis</th>
                <th>Medicines</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-5 text-muted">
                    <Spinner animation="border" size="sm" className="me-2" />
                    Loading medical prescriptions...
                  </td>
                </tr>
              ) : prescriptions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-5 text-muted">
                    <i className="bi bi-capsule fs-2 d-block text-secondary mb-2"></i>
                    No prescriptions found.
                  </td>
                </tr>
              ) : (
                prescriptions.map((rx) => {
                  const rxDate = new Date(rx.prescriptionDate || rx.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });

                  return (
                    <tr key={rx._id}>
                      <td>
                        <div className="fw-medium text-dark">{rxDate}</div>
                        <span className="font-monospace small text-primary">
                          {rx.consultation?.appointment?.appointmentCode || 'APT'}
                        </span>
                      </td>
                      <td>
                        <div className="fw-semibold text-dark">
                          {rx.patient ? `${rx.patient.firstName} ${rx.patient.lastName}` : 'N/A'}
                        </div>
                        <div className="text-muted small">
                          {rx.patient?.patientCode} &bull; {rx.patient?.bloodGroup || 'Blood N/A'}
                        </div>
                      </td>
                      <td>
                        <div className="fw-semibold text-dark">
                          {rx.doctor?.user?.name || 'Physician'}
                        </div>
                        <div className="text-muted small">
                          {rx.doctor?.specialization || 'General'}
                        </div>
                      </td>
                      <td>
                        <Badge bg="info-subtle" className="text-info-emphasis border border-info-subtle fw-medium px-2 py-1">
                          {rx.consultation?.diagnosis || 'Consultation'}
                        </Badge>
                      </td>
                      <td>
                        <div className="d-flex flex-wrap gap-1">
                          {rx.items?.map((item, idx) => (
                            <Badge key={idx} bg="light" text="dark" className="border font-monospace">
                              {item.medicineName} ({item.dosage})
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="text-end">
                        <div className="d-flex justify-content-end gap-1">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            title="View / Print Rx Dossier"
                            onClick={() => openPrintModal(rx._id)}
                          >
                            <i className="bi bi-printer me-1"></i> Print Rx
                          </Button>
                          <Button
                            variant="outline-success"
                            size="sm"
                            title="Generate Invoice"
                            onClick={() => navigate(`/invoices?patientId=${rx.patient?._id}`)}
                          >
                            <i className="bi bi-receipt"></i>
                          </Button>
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
              Page {page} of {totalPages} ({totalPrescriptions} total)
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

      {/* Issue Prescription Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="xl" centered>
        <Modal.Header closeButton>
          <Modal.Title className="h5 fw-bold d-flex align-items-center gap-2">
            <i className="bi bi-capsule-pill text-primary"></i>
            Issue Medical Prescription (Rx)
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateSubmit}>
          <Modal.Body className="p-4">
            {createError && (
              <Alert variant="danger" className="py-2 small">
                <i className="bi bi-exclamation-triangle me-1"></i> {createError}
              </Alert>
            )}

            <Form.Group className="mb-4">
              <Form.Label className="small fw-semibold text-muted">
                SELECT CLINICAL CONSULTATION <span className="text-danger">*</span>
              </Form.Label>
              <Form.Select
                value={selectedConsultationId}
                onChange={(e) => setSelectedConsultationId(e.target.value)}
                required
              >
                <option value="">-- Choose Completed Consultation --</option>
                {eligibleConsultations.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.patient?.firstName} {c.patient?.lastName} ({c.patient?.patientCode}) &bull; Diagnosis: {c.diagnosis} &bull; Dr. {c.doctor?.user?.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold mb-0 text-dark">Prescribed Medications</h6>
              <Button variant="outline-primary" size="sm" onClick={addMedicineRow}>
                <i className="bi bi-plus-circle me-1"></i> Add Medicine
              </Button>
            </div>

            {medicineItems.map((item, index) => (
              <Card key={index} className="mb-3 border bg-light">
                <Card.Body className="p-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="badge bg-secondary">Medicine #{index + 1}</span>
                    {medicineItems.length > 1 && (
                      <Button
                        variant="link"
                        className="text-danger p-0 small text-decoration-none"
                        onClick={() => removeMedicineRow(index)}
                      >
                        <i className="bi bi-trash me-1"></i> Remove
                      </Button>
                    )}
                  </div>
                  <Row className="g-2">
                    <Col xs={12} md={3}>
                      <Form.Label className="small text-muted fw-semibold">Medicine Name *</Form.Label>
                      <Form.Control
                        size="sm"
                        placeholder="e.g. Paracetamol"
                        value={item.medicineName}
                        onChange={(e) => updateMedicineField(index, 'medicineName', e.target.value)}
                        required
                      />
                    </Col>
                    <Col xs={6} md={2}>
                      <Form.Label className="small text-muted fw-semibold">Dosage *</Form.Label>
                      <Form.Control
                        size="sm"
                        placeholder="e.g. 500 mg"
                        value={item.dosage}
                        onChange={(e) => updateMedicineField(index, 'dosage', e.target.value)}
                        required
                      />
                    </Col>
                    <Col xs={6} md={2}>
                      <Form.Label className="small text-muted fw-semibold">Frequency *</Form.Label>
                      <Form.Control
                        size="sm"
                        placeholder="e.g. Twice daily"
                        value={item.frequency}
                        onChange={(e) => updateMedicineField(index, 'frequency', e.target.value)}
                        required
                      />
                    </Col>
                    <Col xs={6} md={2}>
                      <Form.Label className="small text-muted fw-semibold">Duration *</Form.Label>
                      <Form.Control
                        size="sm"
                        placeholder="e.g. 5 days"
                        value={item.duration}
                        onChange={(e) => updateMedicineField(index, 'duration', e.target.value)}
                        required
                      />
                    </Col>
                    <Col xs={6} md={3}>
                      <Form.Label className="small text-muted fw-semibold">Instructions</Form.Label>
                      <Form.Control
                        size="sm"
                        placeholder="e.g. Take after food"
                        value={item.instructions}
                        onChange={(e) => updateMedicineField(index, 'instructions', e.target.value)}
                      />
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            ))}

            <Form.Group className="mt-3">
              <Form.Label className="small fw-semibold text-muted">
                GENERAL ADVICE & INSTRUCTIONS FOR PATIENT
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                placeholder="e.g. Avoid cold drinks, maintain hydration, rest for 3 days..."
                value={generalInstructions}
                onChange={(e) => setGeneralInstructions(e.target.value)}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={createSubmitting}>
              {createSubmitting ? (
                <>
                  <Spinner animation="border" size="sm" className="me-1" />
                  Generating prescription...
                </>
              ) : (
                <>
                  <i className="bi bi-check-circle me-1"></i>
                  Issue Medical Prescription
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Section 21: Printable Prescription Dossier Modal */}
      <Modal show={showPrintModal} onHide={() => setShowPrintModal(false)} size="lg" centered>
        <Modal.Header closeButton className="d-print-none">
          <Modal.Title className="h5 fw-bold">Official Medical Prescription (Rx)</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4" id="printable-rx-area">
          {selectedPrescription && (
            <div className="p-3 border rounded bg-white">
              {/* Clinic Letterhead */}
              <div className="border-bottom pb-3 mb-3 d-flex justify-content-between align-items-start">
                <div>
                  <h4 className="fw-bold text-primary mb-0 d-flex align-items-center gap-2">
                    <i className="bi bi-hospital"></i>
                    METROPOLITAN CLINIC
                  </h4>
                  <p className="text-muted small mb-0">
                    Comprehensive Outpatient Healthcare &bull; Reg: MC-2026-HQ
                  </p>
                  <p className="text-muted small mb-0">
                    124 Healthcare Boulevard, City Centre &bull; Contact: +91 98765 43210
                  </p>
                </div>
                <div className="text-end">
                  <h6 className="fw-bold text-dark mb-0">
                    Dr. {selectedPrescription.doctor?.user?.name}
                  </h6>
                  <div className="text-primary small fw-semibold">
                    {selectedPrescription.doctor?.specialization}
                  </div>
                  <div className="text-muted small">
                    Reg No: {selectedPrescription.doctor?.registrationNumber || 'MED-REG-84729'}
                  </div>
                </div>
              </div>

              {/* Patient & Date Meta */}
              <div className="bg-light p-3 rounded mb-3">
                <Row className="g-2 small">
                  <Col xs={6} md={3}>
                    <strong className="text-muted d-block">PATIENT NAME</strong>
                    <span className="fw-bold">
                      {selectedPrescription.patient?.firstName} {selectedPrescription.patient?.lastName}
                    </span>
                  </Col>
                  <Col xs={6} md={3}>
                    <strong className="text-muted d-block">PATIENT CODE</strong>
                    <span className="font-monospace text-primary">
                      {selectedPrescription.patient?.patientCode}
                    </span>
                  </Col>
                  <Col xs={6} md={3}>
                    <strong className="text-muted d-block">GENDER / BLOOD GROUP</strong>
                    <span>
                      {selectedPrescription.patient?.gender} &bull; {selectedPrescription.patient?.bloodGroup || 'O+'}
                    </span>
                  </Col>
                  <Col xs={6} md={3}>
                    <strong className="text-muted d-block">DATE</strong>
                    <span className="fw-semibold">
                      {new Date(selectedPrescription.prescriptionDate || selectedPrescription.createdAt).toLocaleDateString()}
                    </span>
                  </Col>
                </Row>
              </div>

              {/* Clinical Diagnosis */}
              {selectedPrescription.consultation?.diagnosis && (
                <div className="mb-3">
                  <strong className="small text-muted text-uppercase d-block mb-1">
                    Clinical Diagnosis
                  </strong>
                  <div className="p-2 border rounded bg-white fw-semibold text-dark">
                    {selectedPrescription.consultation.diagnosis}
                  </div>
                </div>
              )}

              {/* Rx Symbol & Medication Table */}
              <div className="mb-4">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <span className="display-6 fw-bold text-primary" style={{ fontFamily: 'serif' }}>
                    ℞
                  </span>
                  <span className="small text-muted text-uppercase fw-semibold">
                    Medication & Dosage Schedule
                  </span>
                </div>
                <Table bordered responsive size="sm" className="mb-0">
                  <thead className="table-light small text-uppercase">
                    <tr>
                      <th>#</th>
                      <th>Medicine Name</th>
                      <th>Dosage</th>
                      <th>Frequency</th>
                      <th>Duration</th>
                      <th>Route</th>
                      <th>Instructions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPrescription.items?.map((item, idx) => (
                      <tr key={idx}>
                        <td className="text-muted small">{idx + 1}</td>
                        <td className="fw-bold text-dark">{item.medicineName}</td>
                        <td className="font-monospace">{item.dosage}</td>
                        <td>{item.frequency}</td>
                        <td>{item.duration}</td>
                        <td>{item.route || 'Oral'}</td>
                        <td className="small text-muted">{item.instructions || 'As advised'}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>

              {/* Physician Advice */}
              {selectedPrescription.instructions && (
                <div className="mb-4">
                  <strong className="small text-muted text-uppercase d-block mb-1">
                    General Physician Instructions
                  </strong>
                  <p className="small mb-0 p-2 border rounded bg-light">
                    {selectedPrescription.instructions}
                  </p>
                </div>
              )}

              {/* Doctor Signature Block */}
              <div className="border-top pt-4 mt-4 d-flex justify-content-between align-items-end">
                <div className="small text-muted">
                  <div>* Valid for 30 days from date of issuance.</div>
                  <div>* Please complete the full antibiotic course if prescribed.</div>
                </div>
                <div className="text-center" style={{ minWidth: '180px' }}>
                  <div className="border-bottom pb-2 font-monospace text-primary fw-bold" style={{ borderStyle: 'dashed !important' }}>
                    Dr. {selectedPrescription.doctor?.user?.name}
                  </div>
                  <div className="small text-muted mt-1">Authorized Physician Signature</div>
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="d-print-none">
          <Button variant="secondary" onClick={() => setShowPrintModal(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={() => window.print()}>
            <i className="bi bi-printer me-1"></i> Print Prescription
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default PrescriptionsPage;
