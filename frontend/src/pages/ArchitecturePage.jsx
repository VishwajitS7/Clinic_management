import React from 'react';
import { Container, Row, Col, Card, Accordion, Badge } from 'react-bootstrap';

const ArchitecturePage = () => {
  return (
    <Container className="py-4">
      <div className="mb-4 pb-2 border-bottom">
        <h2 className="fw-bold mb-1 d-flex align-items-center gap-2">
          <i className="bi bi-diagram-3 text-primary"></i>
          System Architecture & Technical Design
        </h2>
        <p className="text-muted mb-0">
          Clean layered architecture, separation of concerns, and foundational interview defense rationale.
        </p>
      </div>

      <Row className="g-4 mb-4">
        {/* Layered Flow */}
        <Col lg={6}>
          <Card className="clinic-card border-0 shadow-sm h-100">
            <div className="clinic-card-header d-flex justify-content-between align-items-center">
              <span>Layered Request Lifecycle</span>
              <Badge bg="primary">Backend</Badge>
            </div>
            <Card.Body>
              <div className="d-flex flex-column gap-2 font-monospace small">
                <div className="p-2 border rounded bg-light">
                  <strong>1. HTTP Request</strong> — Incoming client request from Axios via Vite proxy
                </div>
                <div className="p-2 border rounded bg-light">
                  <strong>2. Route Layer</strong> — URL definition and router dispatching (`/api/...`)
                </div>
                <div className="p-2 border rounded bg-light">
                  <strong>3. Auth & Role Middleware</strong> — JWT verification & role validation (Admin, Doctor, Receptionist)
                </div>
                <div className="p-2 border rounded bg-light">
                  <strong>4. Validation Layer</strong> — Payload format, field constraints, schema rules
                </div>
                <div className="p-2 border rounded bg-light">
                  <strong>5. Controller Layer</strong> — Request/Response orchestration, parameter extraction
                </div>
                <div className="p-2 border rounded bg-light">
                  <strong>6. Service Layer</strong> — Core domain business logic (e.g. interval conflict math, billing totals)
                </div>
                <div className="p-2 border rounded bg-light">
                  <strong>7. Mongoose Model Layer</strong> — Data schema, indexes, hooks, database persistence
                </div>
                <div className="p-2 border rounded bg-light">
                  <strong>8. MongoDB Atlas</strong> — Cloud document storage with referencing and embedded subdocuments
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Why this stack */}
        <Col lg={6}>
          <Card className="clinic-card border-0 shadow-sm h-100">
            <div className="clinic-card-header d-flex justify-content-between align-items-center">
              <span>Key Architectural Decisions</span>
              <Badge bg="success">Interview Readiness</Badge>
            </div>
            <Card.Body>
              <Accordion defaultActiveKey="0" flush>
                <Accordion.Item eventKey="0">
                  <Accordion.Header>Why Separate Service Layer from Controllers?</Accordion.Header>
                  <Accordion.Body className="small text-muted">
                    Controllers handle HTTP concerns (status codes, headers, req/res mapping). Services encapsulate pure business logic (slot calculation, booking conflict rules, financial invoice totals). This keeps code modular, testable, and reusable across multiple entry points.
                  </Accordion.Body>
                </Accordion.Item>
                <Accordion.Item eventKey="1">
                  <Accordion.Header>Why Referencing vs. Embedding in MongoDB?</Accordion.Header>
                  <Accordion.Body className="small text-muted">
                    We reference independent domain entities with separate lifecycles (Patients, Doctors, Appointments, Invoices) using Mongoose ObjectId references. We embed tightly coupled child records that have no independent identity outside the parent (Prescription Items, Invoice Items).
                  </Accordion.Body>
                </Accordion.Item>
                <Accordion.Item eventKey="2">
                  <Accordion.Header>How is Interval Overlap Detected?</Accordion.Header>
                  <Accordion.Body className="small text-muted">
                    To prevent double booking without race conditions, two intervals <code>[newStart, newEnd]</code> and <code>[existingStart, existingEnd]</code> conflict when <code>newStart &lt; existingEnd &amp;&amp; newEnd &gt; existingStart</code>. Validated on the backend before insertion.
                  </Accordion.Body>
                </Accordion.Item>
                <Accordion.Item eventKey="3">
                  <Accordion.Header>Why Calculate Financial Totals on Backend?</Accordion.Header>
                  <Accordion.Body className="small text-muted">
                    Never trust client financial values. The backend recalculates item quantity × unitPrice, subtotal, discount deductions, tax rates, and remaining balance due to prevent tampering.
                  </Accordion.Body>
                </Accordion.Item>
              </Accordion>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ArchitecturePage;
