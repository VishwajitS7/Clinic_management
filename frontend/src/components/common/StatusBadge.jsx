import React from 'react';
import { Badge } from 'react-bootstrap';

const STATUS_VARIANTS = {
  // Appointment status
  SCHEDULED: 'info',
  CONFIRMED: 'primary',
  COMPLETED: 'success',
  CANCELLED: 'danger',
  NO_SHOW: 'secondary',

  // Invoice / Payment status
  UNPAID: 'danger',
  PARTIALLY_PAID: 'warning',
  PAID: 'success',

  // Active status
  ACTIVE: 'success',
  INACTIVE: 'secondary',
};

const StatusBadge = ({ status, className = '' }) => {
  if (!status) return null;

  const normalized = status.toUpperCase();
  const variant = STATUS_VARIANTS[normalized] || 'secondary';

  return (
    <Badge bg={variant} className={`px-2 py-1 fw-semibold text-uppercase ${className}`} style={{ fontSize: '0.75rem' }}>
      {status}
    </Badge>
  );
};

export default StatusBadge;
