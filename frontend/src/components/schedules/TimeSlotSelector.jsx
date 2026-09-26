import React from 'react';
import { Row, Col, Button, Badge } from 'react-bootstrap';

/**
 * Reusable TimeSlotSelector Component
 * Compliant with Section 38 & Section 39:
 * Renders dynamically computed slots with available (✓) and booked (✕) indicators.
 */
const TimeSlotSelector = ({
  slots = [],
  selectedSlot = null,
  onSelectSlot,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="text-center py-4 text-muted small">
        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
        Computing real-time interval availability...
      </div>
    );
  }

  if (!slots || slots.length === 0) {
    return (
      <div className="p-3 bg-light rounded text-center text-muted small border">
        <i className="bi bi-calendar-x fs-4 d-block mb-1"></i>
        No clinical time slots configured or available on this date.
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <span className="small fw-semibold text-muted">SELECT APPOINTMENT SLOT</span>
        <div className="d-flex gap-2 small">
          <span className="badge bg-success-subtle text-success border border-success-subtle">
            ✓ Available
          </span>
          <span className="badge bg-danger-subtle text-danger border border-danger-subtle">
            ✕ Booked / Conflict
          </span>
        </div>
      </div>

      <Row className="g-2">
        {slots.map((slot, index) => {
          const isSelected = selectedSlot && selectedSlot.startTime === slot.startTime;

          return (
            <Col xs={6} sm={4} md={3} key={index}>
              <Button
                variant={
                  !slot.available
                    ? 'light'
                    : isSelected
                    ? 'primary'
                    : 'outline-primary'
                }
                size="sm"
                className={`w-100 py-2 d-flex justify-content-between align-items-center ${
                  !slot.available ? 'text-muted border bg-light opacity-50' : ''
                }`}
                disabled={!slot.available}
                onClick={() => slot.available && onSelectSlot && onSelectSlot(slot)}
              >
                <span className="fw-medium font-monospace">{slot.startTime}</span>
                <span className="ms-1">
                  {slot.available ? (
                    <span className="text-success fw-bold">✓</span>
                  ) : (
                    <span className="text-danger fw-bold">✕</span>
                  )}
                </span>
              </Button>
            </Col>
          );
        })}
      </Row>
    </div>
  );
};

export default TimeSlotSelector;
