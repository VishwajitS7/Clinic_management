const AppError = require('../utils/AppError');

/**
 * Validates consultation creation data
 */
const validateCreateConsultation = (data) => {
  const errors = [];
  const { appointmentId, symptoms, diagnosis } = data;

  if (!appointmentId) errors.push('Appointment ID is required');
  if (!symptoms || !symptoms.trim()) errors.push('Patient symptoms description is required');
  if (!diagnosis || !diagnosis.trim()) errors.push('Clinical diagnosis is required');

  if (data.followUpDate) {
    const fDate = new Date(data.followUpDate);
    if (isNaN(fDate.getTime())) {
      errors.push('Invalid followUpDate format');
    }
  }

  if (errors.length > 0) {
    throw new AppError(errors.join(', '), 400);
  }
};

/**
 * Validates consultation update data
 */
const validateUpdateConsultation = (data) => {
  const errors = [];
  const { symptoms, diagnosis } = data;

  if (symptoms !== undefined && !symptoms.trim()) {
    errors.push('Symptoms description cannot be empty');
  }
  if (diagnosis !== undefined && !diagnosis.trim()) {
    errors.push('Diagnosis cannot be empty');
  }

  if (errors.length > 0) {
    throw new AppError(errors.join(', '), 400);
  }
};

module.exports = {
  validateCreateConsultation,
  validateUpdateConsultation,
};
