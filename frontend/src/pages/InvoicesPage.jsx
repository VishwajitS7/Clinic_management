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
import { useSearchParams } from 'react-router-dom';
import invoiceService from '../services/invoiceService';
import patientService from '../services/patientService';
import appointmentService from '../services/appointmentService';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/common/StatusBadge';

const InvoicesPage = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const paramPatientId = searchParams.get('patientId');

  // Invoices State
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalInvoices, setTotalInvoices] = useState(0);

  // References State
  const [patientsList, setPatientsList] = useState([]);
  const [appointmentsList, setAppointmentsList] = useState([]);

  // Create Invoice Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState(paramPatientId || '');
  const [selectedAppointmentId, setSelectedAppointmentId] = useState('');
  const [invoiceItems, setInvoiceItems] = useState([
    { description: 'Specialist Consultation Fee', quantity: 1, unitPrice: 500 },
  ]);
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [createError, setCreateError] = useState('');
  const [createSubmitting, setCreateSubmitting] = useState(false);

  // Record Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [activeInvoiceForPayment, setActiveInvoiceForPayment] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [transactionRef, setTransactionRef] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);

  // Printable Invoice / Receipt Modal State
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedInvoiceDetail, setSelectedInvoiceDetail] = useState(null);

  // Fetch reference lists (Patients & Appointments)
  useEffect(() => {
    const fetchRefs = async () => {
      try {
        const [patsRes, aptsRes] = await Promise.all([
          patientService.getAllPatients({ limit: 100 }),
          appointmentService.getAppointments({ limit: 100 }),
        ]);
        setPatientsList(patsRes.data || []);
        setAppointmentsList(aptsRes.data || []);
      } catch (err) {
        console.error('Failed to load references:', err);
      }
    };
    fetchRefs();
  }, []);

  // Fetch Invoices
  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: 10,
        search: search.trim() || undefined,
        status: statusFilter || undefined,
        patientId: paramPatientId || undefined,
      };

      const res = await invoiceService.getInvoices(params);
      setInvoices(res.data || []);
      if (res.pagination) {
        setTotalPages(res.pagination.totalPages || 1);
        setTotalInvoices(res.pagination.total || 0);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, paramPatientId]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // Invoice Items Helpers
  const addInvoiceItem = () => {
    setInvoiceItems([
      ...invoiceItems,
      { description: '', quantity: 1, unitPrice: 0 },
    ]);
  };

  const removeInvoiceItem = (index) => {
    if (invoiceItems.length <= 1) return;
    setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
  };

  const updateItemField = (index, field, value) => {
    const updated = [...invoiceItems];
    updated[index][field] = value;
    setInvoiceItems(updated);
  };

  // Real-time calculation helpers for Create Modal
  const calculatedSubtotal = invoiceItems.reduce(
    (acc, item) => acc + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
    0
  );
  const calculatedTotal = Math.max(0, calculatedSubtotal - (Number(discount) || 0) + (Number(tax) || 0));

  // Handle Create Invoice Submit
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPatientId) {
      setCreateError('Please select a patient');
      return;
    }
    if (!selectedAppointmentId) {
      setCreateError('Please select an appointment');
      return;
    }

    for (let i = 0; i < invoiceItems.length; i++) {
      const itm = invoiceItems[i];
      if (!itm.description.trim()) {
        setCreateError(`Item #${i + 1}: Description is required`);
        return;
      }
      if (Number(itm.quantity) <= 0) {
        setCreateError(`Item #${i + 1}: Quantity must be at least 1`);
        return;
      }
      if (Number(itm.unitPrice) < 0) {
        setCreateError(`Item #${i + 1}: Unit price cannot be negative`);
        return;
      }
    }

    if (Number(discount) > calculatedSubtotal) {
      setCreateError('Discount cannot exceed subtotal amount');
      return;
    }

    setCreateSubmitting(true);
    setCreateError('');

    try {
      await invoiceService.createInvoice({
        patientId: selectedPatientId,
        appointmentId: selectedAppointmentId,
        items: invoiceItems,
        discount: Number(discount) || 0,
        tax: Number(tax) || 0,
      });

      setShowCreateModal(false);
      setSuccessMsg('Invoice generated successfully!');
      setTimeout(() => setSuccessMsg(''), 5000);
      // Reset form
      setSelectedPatientId('');
      setSelectedAppointmentId('');
      setInvoiceItems([{ description: 'Specialist Consultation Fee', quantity: 1, unitPrice: 500 }]);
      setDiscount(0);
      setTax(0);
      fetchInvoices();
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Failed to generate invoice');
    } finally {
      setCreateSubmitting(false);
    }
  };

  // Open Payment Modal
  const openPaymentModal = (invoice) => {
    setActiveInvoiceForPayment(invoice);
    setPaymentAmount(invoice.amountDue);
    setPaymentMethod('UPI');
    setTransactionRef('');
    setPaymentNotes('');
    setPaymentError('');
    setShowPaymentModal(true);
  };

  // Handle Record Payment Submit
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    const amountNum = Number(paymentAmount);
    if (!amountNum || amountNum <= 0) {
      setPaymentError('Payment amount must be greater than zero');
      return;
    }
    if (amountNum > activeInvoiceForPayment.amountDue) {
      setPaymentError(
        `Payment amount ₹${amountNum} exceeds the remaining balance due of ₹${activeInvoiceForPayment.amountDue}`
      );
      return;
    }

    setPaymentSubmitting(true);
    setPaymentError('');

    try {
      await invoiceService.recordPayment(activeInvoiceForPayment._id, {
        amount: amountNum,
        paymentMethod,
        transactionReference: transactionRef.trim() || undefined,
        notes: paymentNotes.trim() || undefined,
      });

      setShowPaymentModal(false);
      setSuccessMsg(`Payment of ₹${amountNum} recorded successfully!`);
      setTimeout(() => setSuccessMsg(''), 5000);
      fetchInvoices();
    } catch (err) {
      setPaymentError(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setPaymentSubmitting(false);
    }
  };

  // Open Invoice / Receipt Printable View
  const openPrintModal = async (invoiceId) => {
    try {
      const res = await invoiceService.getInvoiceById(invoiceId);
      setSelectedInvoiceDetail(res.data);
      setShowPrintModal(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load invoice receipt');
    }
  };

  return (
    <Container className="py-4">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1 d-flex align-items-center gap-2">
            <i className="bi bi-receipt-cutoff text-primary"></i>
            Billing & Invoices
          </h2>
          <p className="text-muted mb-0 small">
            Itemized clinical charges, automated tax/discount calculations, and multi-tender payment processing.
          </p>
        </div>
        {(user?.role === 'ADMIN' || user?.role === 'RECEPTIONIST') && (
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
              Create New Invoice
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
            <Col xs={12} md={8}>
              <InputGroup size="sm">
                <InputGroup.Text className="bg-light border-end-0">
                  <i className="bi bi-search text-muted"></i>
                </InputGroup.Text>
                <Form.Control
                  placeholder="Search invoice number or charge description..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="border-start-0"
                />
              </InputGroup>
            </Col>
            <Col xs={12} md={4}>
              <Form.Select
                size="sm"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Payment Statuses</option>
                <option value="UNPAID">Unpaid</option>
                <option value="PARTIALLY_PAID">Partially Paid</option>
                <option value="PAID">Fully Paid</option>
                <option value="CANCELLED">Cancelled</option>
              </Form.Select>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Invoices Table */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Header className="bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
          <div className="fw-semibold">
            <i className="bi bi-credit-card me-2 text-primary"></i>
            Commercial Invoices ({totalInvoices})
          </div>
          <Button variant="outline-secondary" size="sm" onClick={fetchInvoices} disabled={loading}>
            <i className={`bi bi-arrow-clockwise ${loading ? 'spin' : ''}`}></i> Refresh
          </Button>
        </Card.Header>
        <div className="table-responsive">
          <Table hover align="middle" className="mb-0">
            <thead className="table-light text-muted small text-uppercase">
              <tr>
                <th>Invoice #</th>
                <th>Patient</th>
                <th>Issued Date</th>
                <th>Total (₹)</th>
                <th>Paid (₹)</th>
                <th>Due (₹)</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-5 text-muted">
                    <Spinner animation="border" size="sm" className="me-2" />
                    Loading billing invoices...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-5 text-muted">
                    <i className="bi bi-receipt fs-2 d-block text-secondary mb-2"></i>
                    No invoices found.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => {
                  const issueDate = new Date(inv.issuedAt || inv.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });

                  return (
                    <tr key={inv._id}>
                      <td>
                        <span className="fw-bold font-monospace text-primary">
                          {inv.invoiceNumber}
                        </span>
                      </td>
                      <td>
                        <div className="fw-semibold text-dark">
                          {inv.patient ? `${inv.patient.firstName} ${inv.patient.lastName}` : 'N/A'}
                        </div>
                        <div className="text-muted small">
                          {inv.patient?.patientCode}
                        </div>
                      </td>
                      <td>
                        <span className="small text-muted">{issueDate}</span>
                      </td>
                      <td>
                        <span className="fw-bold text-dark font-monospace">
                          ₹{inv.totalAmount.toFixed(2)}
                        </span>
                      </td>
                      <td>
                        <span className="text-success fw-semibold font-monospace">
                          ₹{inv.amountPaid.toFixed(2)}
                        </span>
                      </td>
                      <td>
                        <span className={`fw-bold font-monospace ${inv.amountDue > 0 ? 'text-danger' : 'text-muted'}`}>
                          ₹{inv.amountDue.toFixed(2)}
                        </span>
                      </td>
                      <td>
                        <StatusBadge status={inv.status} />
                      </td>
                      <td className="text-end">
                        <div className="d-flex justify-content-end gap-1">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            title="View / Print Tax Invoice Receipt"
                            onClick={() => openPrintModal(inv._id)}
                          >
                            <i className="bi bi-printer me-1"></i> Receipt
                          </Button>
                          {(user?.role === 'ADMIN' || user?.role === 'RECEPTIONIST') && inv.status !== 'PAID' && inv.status !== 'CANCELLED' && (
                            <Button
                              variant="success"
                              size="sm"
                              title="Record Payment"
                              onClick={() => openPaymentModal(inv)}
                            >
                              <i className="bi bi-cash-coin me-1"></i> Pay
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
              Page {page} of {totalPages} ({totalInvoices} total)
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

      {/* Create Invoice Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title className="h5 fw-bold d-flex align-items-center gap-2">
            <i className="bi bi-file-earmark-plus text-primary"></i>
            Generate Clinical Invoice
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateSubmit}>
          <Modal.Body className="p-4">
            {createError && (
              <Alert variant="danger" className="py-2 small">
                <i className="bi bi-exclamation-triangle me-1"></i> {createError}
              </Alert>
            )}

            <Row className="g-3 mb-3">
              <Col xs={12} md={6}>
                <Form.Group>
                  <Form.Label className="small fw-semibold text-muted">
                    SELECT PATIENT <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Select
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Patient --</option>
                    {patientsList.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.patientCode} &bull; {p.firstName} {p.lastName}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col xs={12} md={6}>
                <Form.Group>
                  <Form.Label className="small fw-semibold text-muted">
                    SELECT APPOINTMENT <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Select
                    value={selectedAppointmentId}
                    onChange={(e) => setSelectedAppointmentId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Appointment --</option>
                    {appointmentsList.map((apt) => (
                      <option key={apt._id} value={apt._id}>
                        {apt.appointmentCode} &bull; {apt.patient?.firstName} {apt.patient?.lastName} ({apt.startTime})
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            {/* Line Items */}
            <div className="d-flex justify-content-between align-items-center mb-2 mt-4">
              <h6 className="fw-bold mb-0 text-dark">Invoice Line Items</h6>
              <Button variant="outline-primary" size="sm" onClick={addInvoiceItem}>
                <i className="bi bi-plus-circle me-1"></i> Add Line Item
              </Button>
            </div>

            {invoiceItems.map((item, idx) => (
              <div key={idx} className="p-2 border rounded bg-light mb-2">
                <Row className="g-2 align-items-center">
                  <Col xs={12} md={6}>
                    <Form.Control
                      size="sm"
                      placeholder="Item description (e.g. ECG, Consultation Fee)"
                      value={item.description}
                      onChange={(e) => updateItemField(idx, 'description', e.target.value)}
                      required
                    />
                  </Col>
                  <Col xs={4} md={2}>
                    <Form.Control
                      size="sm"
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => updateItemField(idx, 'quantity', e.target.value)}
                      required
                    />
                  </Col>
                  <Col xs={4} md={2}>
                    <Form.Control
                      size="sm"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Unit Price"
                      value={item.unitPrice}
                      onChange={(e) => updateItemField(idx, 'unitPrice', e.target.value)}
                      required
                    />
                  </Col>
                  <Col xs={3} md={1} className="font-monospace small fw-bold text-end">
                    ₹{((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)).toFixed(2)}
                  </Col>
                  <Col xs={1} md={1} className="text-end">
                    {invoiceItems.length > 1 && (
                      <Button
                        variant="link"
                        className="text-danger p-0"
                        onClick={() => removeInvoiceItem(idx)}
                      >
                        <i className="bi bi-x-circle"></i>
                      </Button>
                    )}
                  </Col>
                </Row>
              </div>
            ))}

            {/* Financial Summary Calculation Panel */}
            <div className="mt-3 p-3 bg-white rounded border">
              <Row className="g-3">
                <Col xs={6} md={3}>
                  <Form.Label className="small text-muted fw-semibold">Discount (₹)</Form.Label>
                  <Form.Control
                    size="sm"
                    type="number"
                    min="0"
                    step="0.01"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                  />
                </Col>
                <Col xs={6} md={3}>
                  <Form.Label className="small text-muted fw-semibold">Tax (₹)</Form.Label>
                  <Form.Control
                    size="sm"
                    type="number"
                    min="0"
                    step="0.01"
                    value={tax}
                    onChange={(e) => setTax(e.target.value)}
                  />
                </Col>
                <Col xs={12} md={6} className="text-end d-flex flex-column justify-content-center">
                  <div className="text-muted small">
                    Subtotal: <span className="font-monospace">₹{calculatedSubtotal.toFixed(2)}</span>
                  </div>
                  <div className="h5 fw-bold text-primary mb-0 mt-1">
                    Grand Total: <span className="font-monospace">₹{calculatedTotal.toFixed(2)}</span>
                  </div>
                </Col>
              </Row>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={createSubmitting}>
              {createSubmitting ? 'Generating...' : 'Confirm & Create Invoice'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Record Payment Modal */}
      <Modal show={showPaymentModal} onHide={() => setShowPaymentModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="h5 fw-bold d-flex align-items-center gap-2">
            <i className="bi bi-cash-stack text-success"></i>
            Record Payment Receipt
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handlePaymentSubmit}>
          <Modal.Body className="p-4">
            {paymentError && (
              <Alert variant="danger" className="py-2 small">
                <i className="bi bi-exclamation-triangle me-1"></i> {paymentError}
              </Alert>
            )}

            {activeInvoiceForPayment && (
              <div className="mb-3 p-3 bg-light rounded border">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="small text-muted">Invoice:</span>
                  <span className="font-monospace fw-bold text-primary">
                    {activeInvoiceForPayment.invoiceNumber}
                  </span>
                </div>
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="small text-muted">Patient:</span>
                  <span className="fw-semibold">
                    {activeInvoiceForPayment.patient?.firstName} {activeInvoiceForPayment.patient?.lastName}
                  </span>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <span className="small text-muted">Remaining Balance Due:</span>
                  <span className="fw-bold text-danger font-monospace fs-5">
                    ₹{activeInvoiceForPayment.amountDue.toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold text-muted">
                PAYMENT AMOUNT (₹) <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="number"
                step="0.01"
                min="0.01"
                max={activeInvoiceForPayment?.amountDue}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                required
              />
              <Form.Text className="text-muted small">
                Strict server enforcement: Payment amount cannot exceed balance due.
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold text-muted">
                TENDER METHOD <span className="text-danger">*</span>
              </Form.Label>
              <Form.Select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                required
              >
                <option value="UPI">UPI / QR Code</option>
                <option value="CASH">Cash</option>
                <option value="CARD">Credit / Debit Card</option>
                <option value="ONLINE">Net Banking / Online</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold text-muted">TRANSACTION REFERENCE</Form.Label>
              <Form.Control
                placeholder="e.g. UPI Ref / Card Last 4 / Receipt #"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold text-muted">PAYMENT NOTES</Form.Label>
              <Form.Control
                placeholder="Optional notes..."
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setShowPaymentModal(false)}>
              Cancel
            </Button>
            <Button variant="success" type="submit" disabled={paymentSubmitting}>
              {paymentSubmitting ? 'Processing...' : 'Confirm Payment'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Section 21: Printable Tax Invoice / Receipt Modal */}
      <Modal show={showPrintModal} onHide={() => setShowPrintModal(false)} size="lg" centered>
        <Modal.Header closeButton className="d-print-none">
          <Modal.Title className="h5 fw-bold">Tax Invoice & Payment Receipt</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4" id="printable-invoice-area">
          {selectedInvoiceDetail && (
            <div className="p-3 border rounded bg-white">
              {/* Header */}
              <div className="border-bottom pb-3 mb-3 d-flex justify-content-between align-items-start">
                <div>
                  <h4 className="fw-bold text-primary mb-0 d-flex align-items-center gap-2">
                    <i className="bi bi-hospital"></i>
                    METROPOLITAN CLINIC
                  </h4>
                  <p className="text-muted small mb-0">GSTIN / TAX ID: 27AABCM8291Q1Z4</p>
                  <p className="text-muted small mb-0">124 Healthcare Boulevard, City Centre</p>
                </div>
                <div className="text-end">
                  <span className="badge bg-primary text-uppercase px-3 py-2 fs-6">
                    TAX INVOICE
                  </span>
                  <div className="font-monospace text-primary fw-bold mt-2">
                    {selectedInvoiceDetail.invoiceNumber}
                  </div>
                  <div className="text-muted small">
                    Date: {new Date(selectedInvoiceDetail.issuedAt || selectedInvoiceDetail.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Billed To */}
              <div className="bg-light p-3 rounded mb-3">
                <Row className="g-2 small">
                  <Col xs={6} md={4}>
                    <strong className="text-muted d-block">BILLED TO (PATIENT)</strong>
                    <span className="fw-bold fs-6">
                      {selectedInvoiceDetail.patient?.firstName} {selectedInvoiceDetail.patient?.lastName}
                    </span>
                    <div className="text-muted">{selectedInvoiceDetail.patient?.patientCode}</div>
                  </Col>
                  <Col xs={6} md={4}>
                    <strong className="text-muted d-block">CONTACT</strong>
                    <div>{selectedInvoiceDetail.patient?.phone || 'No phone'}</div>
                    <div className="text-muted">{selectedInvoiceDetail.patient?.email || ''}</div>
                  </Col>
                  <Col xs={12} md={4} className="text-md-end">
                    <strong className="text-muted d-block">INVOICE STATUS</strong>
                    <StatusBadge status={selectedInvoiceDetail.status} />
                  </Col>
                </Row>
              </div>

              {/* Line Items Table */}
              <Table bordered responsive size="sm" className="mb-3">
                <thead className="table-light small text-uppercase">
                  <tr>
                    <th>#</th>
                    <th>Charge Description</th>
                    <th className="text-center">Qty</th>
                    <th className="text-end">Unit Price (₹)</th>
                    <th className="text-end">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInvoiceDetail.items?.map((item, idx) => (
                    <tr key={idx}>
                      <td className="text-muted small">{idx + 1}</td>
                      <td className="fw-medium text-dark">{item.description}</td>
                      <td className="text-center">{item.quantity}</td>
                      <td className="text-end font-monospace">{item.unitPrice.toFixed(2)}</td>
                      <td className="text-end font-monospace fw-bold">{item.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              {/* Financial Calculation Ledger */}
              <div className="d-flex justify-content-end mb-4">
                <div style={{ minWidth: '240px' }} className="small">
                  <div className="d-flex justify-content-between py-1 border-bottom">
                    <span className="text-muted">Subtotal:</span>
                    <span className="font-monospace">₹{selectedInvoiceDetail.subtotal?.toFixed(2)}</span>
                  </div>
                  {selectedInvoiceDetail.discount > 0 && (
                    <div className="d-flex justify-content-between py-1 border-bottom text-danger">
                      <span>Discount:</span>
                      <span className="font-monospace">-₹{selectedInvoiceDetail.discount?.toFixed(2)}</span>
                    </div>
                  )}
                  {selectedInvoiceDetail.tax > 0 && (
                    <div className="d-flex justify-content-between py-1 border-bottom">
                      <span className="text-muted">Tax:</span>
                      <span className="font-monospace">+₹{selectedInvoiceDetail.tax?.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="d-flex justify-content-between py-2 border-bottom fw-bold text-dark fs-6">
                    <span>Grand Total:</span>
                    <span className="font-monospace">₹{selectedInvoiceDetail.totalAmount?.toFixed(2)}</span>
                  </div>
                  <div className="d-flex justify-content-between py-1 border-bottom text-success fw-semibold">
                    <span>Amount Paid:</span>
                    <span className="font-monospace">₹{selectedInvoiceDetail.amountPaid?.toFixed(2)}</span>
                  </div>
                  <div className="d-flex justify-content-between py-2 fw-bold text-danger fs-6">
                    <span>Balance Due:</span>
                    <span className="font-monospace">₹{selectedInvoiceDetail.amountDue?.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Receipts Ledger */}
              {selectedInvoiceDetail.payments && selectedInvoiceDetail.payments.length > 0 && (
                <div className="border-top pt-3 mb-3">
                  <h6 className="fw-bold small text-muted text-uppercase mb-2">
                    Payment Receipts History
                  </h6>
                  <Table size="sm" borderless className="small mb-0">
                    <thead className="border-bottom text-muted">
                      <tr>
                        <th>Receipt Code</th>
                        <th>Date & Time</th>
                        <th>Method</th>
                        <th>Reference</th>
                        <th className="text-end">Amount Paid</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoiceDetail.payments.map((p) => (
                        <tr key={p._id}>
                          <td className="font-monospace text-primary fw-semibold">{p.paymentCode}</td>
                          <td>{new Date(p.paidAt).toLocaleString()}</td>
                          <td><Badge bg="secondary-subtle" className="text-secondary">{p.paymentMethod}</Badge></td>
                          <td className="text-muted">{p.transactionReference || 'N/A'}</td>
                          <td className="text-end font-monospace text-success fw-bold">₹{p.amount.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}

              {/* Signature / Footer */}
              <div className="border-top pt-4 mt-4 d-flex justify-content-between align-items-end text-muted small">
                <div>
                  <div>Thank you for choosing Metropolitan Clinic.</div>
                  <div>This is a computer-generated tax invoice.</div>
                </div>
                <div className="text-center" style={{ minWidth: '160px' }}>
                  <div className="border-bottom pb-2 fw-semibold text-dark">Accounts Department</div>
                  <div className="small mt-1">Authorized Cashier</div>
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
            <i className="bi bi-printer me-1"></i> Print Tax Receipt
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default InvoicesPage;
