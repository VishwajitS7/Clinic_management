/**
 * Code Generators for Entity Identification
 * Generates human-readable, sequential or formatted codes
 */

const generatePatientCode = (sequenceNumber) => {
  const padded = String(sequenceNumber).padStart(6, '0');
  return `PAT-${padded}`;
};

const generateAppointmentCode = (sequenceNumber, year = new Date().getFullYear()) => {
  const padded = String(sequenceNumber).padStart(6, '0');
  return `APT-${year}-${padded}`;
};

const generateInvoiceNumber = (sequenceNumber, year = new Date().getFullYear()) => {
  const padded = String(sequenceNumber).padStart(6, '0');
  return `INV-${year}-${padded}`;
};

const generatePaymentCode = (sequenceNumber, year = new Date().getFullYear()) => {
  const padded = String(sequenceNumber).padStart(6, '0');
  return `PAY-${year}-${padded}`;
};

module.exports = {
  generatePatientCode,
  generateAppointmentCode,
  generateInvoiceNumber,
  generatePaymentCode,
};
