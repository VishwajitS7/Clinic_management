import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Badge, InputGroup } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SPECIALIZATIONS = [
  'General Medicine',
  'Cardiology',
  'Dermatology',
  'Orthopedics',
  'Pediatrics',
  'Neurology',
  'Gynecology',
  'Ophthalmology',
  'ENT',
  'Psychiatry',
];

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'RECEPTIONIST',
    // Doctor specific fields
    specialization: 'General Medicine',
    qualification: 'MBBS',
    experienceYears: 3,
    licenseNumber: '',
    consultationFee: 500,
  });

  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { register, isAuthenticated, authError } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    // Form Validations
    if (!formData.name.trim()) {
      setFormError('Please enter your full name.');
      return;
    }

    if (!formData.email.trim()) {
      setFormError('Please enter a valid email address.');
      return;
    }

    if (!formData.password || formData.password.length < 6) {
      setFormError('Password must be at least 6 characters long.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setFormError('Passwords do not match. Please re-enter.');
      return;
    }

    if (formData.role === 'DOCTOR') {
      if (!formData.specialization) {
        setFormError('Please select a clinical specialization.');
        return;
      }
      if (!formData.qualification.trim()) {
        setFormError('Please provide your medical qualification (e.g. MBBS, MD).');
        return;
      }
    }

    setIsSubmitting(true);

    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone.trim() || undefined,
      password: formData.password,
      role: formData.role,
    };

    if (formData.role === 'DOCTOR') {
      payload.specialization = formData.specialization;
      payload.qualification = formData.qualification.trim();
      payload.experienceYears = Number(formData.experienceYears) || 1;
      payload.licenseNumber = formData.licenseNumber.trim() || undefined;
      payload.consultationFee = Number(formData.consultationFee) || 500;
    }

    const result = await register(payload);
    setIsSubmitting(false);

    if (result.success) {
      navigate('/dashboard', { replace: true });
    }
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={10} lg={7} xl={6}>
          <div className="text-center mb-4">
            <div className="d-inline-flex align-items-center justify-content-center bg-primary-subtle text-primary rounded-circle p-3 mb-2 shadow-sm">
              <i className="bi bi-person-plus-fill fs-1"></i>
            </div>
            <h3 className="fw-bold mb-1">Create an Account</h3>
            <p className="text-muted small">Register to join the Clinic Appointment Management portal</p>
          </div>

          <Card className="clinic-card border-0 shadow-sm mb-4">
            <Card.Body className="p-4 p-md-5">
              {(formError || authError) && (
                <Alert variant="danger" className="py-2 small mb-4 d-flex align-items-center gap-2">
                  <i className="bi bi-exclamation-triangle-fill fs-5 flex-shrink-0"></i>
                  <div>{formError || authError}</div>
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                {/* Full Name */}
                <Form.Group className="mb-3" controlId="regName">
                  <Form.Label className="small fw-semibold text-muted">
                    FULL NAME <span className="text-danger">*</span>
                  </Form.Label>
                  <InputGroup>
                    <InputGroup.Text className="bg-light text-muted">
                      <i className="bi bi-person"></i>
                    </InputGroup.Text>
                    <Form.Control
                      type="text"
                      name="name"
                      placeholder="e.g. Dr. Priya Patel or Jane Doe"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      disabled={isSubmitting}
                    />
                  </InputGroup>
                </Form.Group>

                {/* Email Address & Phone */}
                <Row className="g-3 mb-3">
                  <Col xs={12} sm={7}>
                    <Form.Group controlId="regEmail">
                      <Form.Label className="small fw-semibold text-muted">
                        EMAIL ADDRESS <span className="text-danger">*</span>
                      </Form.Label>
                      <InputGroup>
                        <InputGroup.Text className="bg-light text-muted">
                          <i className="bi bi-envelope"></i>
                        </InputGroup.Text>
                        <Form.Control
                          type="email"
                          name="email"
                          placeholder="name@clinic.com"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          disabled={isSubmitting}
                        />
                      </InputGroup>
                    </Form.Group>
                  </Col>

                  <Col xs={12} sm={5}>
                    <Form.Group controlId="regPhone">
                      <Form.Label className="small fw-semibold text-muted">PHONE NUMBER</Form.Label>
                      <InputGroup>
                        <InputGroup.Text className="bg-light text-muted">
                          <i className="bi bi-telephone"></i>
                        </InputGroup.Text>
                        <Form.Control
                          type="tel"
                          name="phone"
                          placeholder="+91 98765 43210"
                          value={formData.phone}
                          onChange={handleChange}
                          disabled={isSubmitting}
                        />
                      </InputGroup>
                    </Form.Group>
                  </Col>
                </Row>

                {/* Role Selection */}
                <Form.Group className="mb-4" controlId="regRole">
                  <Form.Label className="small fw-semibold text-muted">
                    SYSTEM ROLE <span className="text-danger">*</span>
                  </Form.Label>
                  <Row className="g-2">
                    <Col xs={4}>
                      <div
                        className={`border rounded p-2 text-center cursor-pointer transition-all ${
                          formData.role === 'RECEPTIONIST'
                            ? 'border-primary bg-primary-subtle text-primary fw-bold'
                            : 'bg-light text-secondary hover-bg-gray'
                        }`}
                        onClick={() => setFormData((p) => ({ ...p, role: 'RECEPTIONIST' }))}
                        role="button"
                      >
                        <i className="bi bi-headset d-block fs-4 mb-1"></i>
                        <span className="small">Receptionist</span>
                      </div>
                    </Col>
                    <Col xs={4}>
                      <div
                        className={`border rounded p-2 text-center cursor-pointer transition-all ${
                          formData.role === 'DOCTOR'
                            ? 'border-success bg-success-subtle text-success fw-bold'
                            : 'bg-light text-secondary hover-bg-gray'
                        }`}
                        onClick={() => setFormData((p) => ({ ...p, role: 'DOCTOR' }))}
                        role="button"
                      >
                        <i className="bi bi-person-badge d-block fs-4 mb-1"></i>
                        <span className="small">Doctor</span>
                      </div>
                    </Col>
                    <Col xs={4}>
                      <div
                        className={`border rounded p-2 text-center cursor-pointer transition-all ${
                          formData.role === 'ADMIN'
                            ? 'border-danger bg-danger-subtle text-danger fw-bold'
                            : 'bg-light text-secondary hover-bg-gray'
                        }`}
                        onClick={() => setFormData((p) => ({ ...p, role: 'ADMIN' }))}
                        role="button"
                      >
                        <i className="bi bi-shield-lock d-block fs-4 mb-1"></i>
                        <span className="small">Admin</span>
                      </div>
                    </Col>
                  </Row>
                </Form.Group>

                {/* Doctor-Specific Fields (Conditional) */}
                {formData.role === 'DOCTOR' && (
                  <div className="bg-light p-3 rounded border border-success-subtle mb-4">
                    <div className="d-flex align-items-center gap-2 mb-3 text-success fw-bold small">
                      <i className="bi bi-stethoscope"></i>
                      <span>DOCTOR PROFESSIONAL PROFILE</span>
                      <Badge bg="success" className="ms-auto">Clinical Practice</Badge>
                    </div>

                    <Row className="g-3">
                      <Col xs={12} sm={6}>
                        <Form.Group controlId="regSpecialization">
                          <Form.Label className="small fw-semibold text-muted">Specialization</Form.Label>
                          <Form.Select
                            name="specialization"
                            value={formData.specialization}
                            onChange={handleChange}
                            size="sm"
                          >
                            {SPECIALIZATIONS.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </Col>

                      <Col xs={12} sm={6}>
                        <Form.Group controlId="regQualification">
                          <Form.Label className="small fw-semibold text-muted">Qualification</Form.Label>
                          <Form.Control
                            type="text"
                            name="qualification"
                            placeholder="e.g. MBBS, MD Internal Med"
                            value={formData.qualification}
                            onChange={handleChange}
                            size="sm"
                            required
                          />
                        </Form.Group>
                      </Col>

                      <Col xs={12} sm={4}>
                        <Form.Group controlId="regLicense">
                          <Form.Label className="small fw-semibold text-muted">License Number</Form.Label>
                          <Form.Control
                            type="text"
                            name="licenseNumber"
                            placeholder="Auto or e.g. NMC-84729"
                            value={formData.licenseNumber}
                            onChange={handleChange}
                            size="sm"
                          />
                          <Form.Text className="text-muted" style={{ fontSize: '0.7rem' }}>
                            Leave blank to auto-generate
                          </Form.Text>
                        </Form.Group>
                      </Col>

                      <Col xs={6} sm={4}>
                        <Form.Group controlId="regFee">
                          <Form.Label className="small fw-semibold text-muted">Fee (₹)</Form.Label>
                          <Form.Control
                            type="number"
                            name="consultationFee"
                            min="0"
                            step="50"
                            value={formData.consultationFee}
                            onChange={handleChange}
                            size="sm"
                            required
                          />
                        </Form.Group>
                      </Col>

                      <Col xs={6} sm={4}>
                        <Form.Group controlId="regExp">
                          <Form.Label className="small fw-semibold text-muted">Experience (Yrs)</Form.Label>
                          <Form.Control
                            type="number"
                            name="experienceYears"
                            min="0"
                            max="60"
                            value={formData.experienceYears}
                            onChange={handleChange}
                            size="sm"
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </div>
                )}

                {/* Password & Confirm Password */}
                <Row className="g-3 mb-4">
                  <Col xs={12} sm={6}>
                    <Form.Group controlId="regPassword">
                      <Form.Label className="small fw-semibold text-muted">
                        PASSWORD <span className="text-danger">*</span>
                      </Form.Label>
                      <InputGroup>
                        <InputGroup.Text className="bg-light text-muted">
                          <i className="bi bi-key"></i>
                        </InputGroup.Text>
                        <Form.Control
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          placeholder="Min 6 characters"
                          value={formData.password}
                          onChange={handleChange}
                          required
                          disabled={isSubmitting}
                        />
                      </InputGroup>
                    </Form.Group>
                  </Col>

                  <Col xs={12} sm={6}>
                    <Form.Group controlId="regConfirmPassword">
                      <Form.Label className="small fw-semibold text-muted">
                        CONFIRM PASSWORD <span className="text-danger">*</span>
                      </Form.Label>
                      <InputGroup>
                        <InputGroup.Text className="bg-light text-muted">
                          <i className="bi bi-shield-check"></i>
                        </InputGroup.Text>
                        <Form.Control
                          type={showPassword ? 'text' : 'password'}
                          name="confirmPassword"
                          placeholder="Re-enter password"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          required
                          disabled={isSubmitting}
                        />
                      </InputGroup>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Check
                  type="checkbox"
                  id="showPasswordToggle"
                  label="Show password"
                  className="small text-muted mb-4"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                />

                {/* Submit Button */}
                <Button
                  variant="primary"
                  type="submit"
                  className="w-100 py-2 fw-semibold d-flex align-items-center justify-content-center gap-2 shadow-sm"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      Registering Account...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-circle-fill"></i>
                      Complete Registration
                    </>
                  )}
                </Button>
              </Form>

              <hr className="my-4 text-muted opacity-25" />

              <div className="text-center">
                <span className="text-muted small">Already have an account? </span>
                <Link to="/login" className="fw-semibold small text-primary text-decoration-none">
                  Sign in here &rarr;
                </Link>
              </div>
            </Card.Body>
          </Card>

          <div className="text-center">
            <Link to="/" className="text-decoration-none small text-muted">
              &larr; Back to Clinic Home
            </Link>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default RegisterPage;
