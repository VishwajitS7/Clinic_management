const AppError = require('../utils/AppError');

/**
 * Validates invoice creation payload
 */
const validateCreateInvoice = (data) => {
  const errors = [];
  const { patientId, appointmentId, items, discount = 0, tax = 0 } = data;

  if (!patientId) errors.push('Patient ID is required');
  if (!appointmentId) errors.push('Appointment ID is required');

  if (!items || !Array.isArray(items) || items.length === 0) {
    errors.push('Invoice must contain at least one line item');
  } else {
    items.forEach((item, index) => {
      const num = index + 1;
      if (!item.description || !item.description.trim()) {
        errors.push(`Item #${num}: description is required`);
      }
      if (item.quantity === undefined || Number(item.quantity) <= 0) {
        errors.push(`Item #${num}: quantity must be at least 1`);
      }
      if (item.unitPrice === undefined || Number(item.unitPrice) < 0) {
        errors.push(`Item #${num}: unit price cannot be negative`);
      }
    });
  }

  if (Number(discount) < 0) {
    errors.push('Discount cannot be negative');
  }

  if (Number(tax) < 0) {
    errors.push('Tax cannot be negative');
  }

  if (errors.length > 0) {
    throw new AppError(errors.join(', '), 400);
  }
};

/**
 * Validates payment recording payload
 */
const validateRecordPayment = (data) => {
  const errors = [];
  const { amount, paymentMethod } = data;

  const validMethods = ['CASH', 'CARD', 'UPI', 'ONLINE'];

  if (amount === undefined || Number(amount) <= 0) {
    errors.push('Payment amount must be greater than zero');
  }

  if (!paymentMethod || !validMethods.includes(paymentMethod)) {
    errors.push(`Payment method must be one of: ${validMethods.join(', ')}`);
  }

  if (errors.length > 0) {
    throw new AppError(errors.join(', '), 400);
  }
};

module.exports = {
  validateCreateInvoice,
  validateRecordPayment,
};
