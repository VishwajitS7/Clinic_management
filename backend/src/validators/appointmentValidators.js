const AppError = require('../utils/AppError');

/**
 * Validates appointment booking request
 */
const validateCreateAppointment = (data) => {
  const errors = [];
  const { patient, doctor, appointmentDate, startTime, endTime, reason } = data;

  if (!patient) errors.push('Patient ID is required');
  if (!doctor) errors.push('Doctor ID is required');
  if (!appointmentDate) errors.push('Appointment date is required');

  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (!startTime || !timeRegex.test(startTime)) {
    errors.push('Valid startTime in HH:mm 24h format is required');
  }
  if (!endTime || !timeRegex.test(endTime)) {
    errors.push('Valid endTime in HH:mm 24h format is required');
  }

  if (startTime && endTime && startTime >= endTime) {
    errors.push('startTime must be earlier than endTime');
  }

  // Check if date is valid
  if (appointmentDate) {
    const aptDate = new Date(appointmentDate);
    if (isNaN(aptDate.getTime())) {
      errors.push('Invalid appointmentDate format');
    }
  }

  if (errors.length > 0) {
    throw new AppError(errors.join(', '), 400);
  }
};

/**
 * Validates status update request
 */
const validateUpdateStatus = (data) => {
  const { status } = data;
  const validStatuses = ['SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];

  if (!status || !validStatuses.includes(status)) {
    throw new AppError(
      `Status must be one of: ${validStatuses.join(', ')}`,
      400
    );
  }
};

/**
 * Validates rescheduling request
 */
const validateRescheduleAppointment = (data) => {
  const errors = [];
  const { appointmentDate, startTime, endTime } = data;

  if (!appointmentDate) errors.push('New appointment date is required');

  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (!startTime || !timeRegex.test(startTime)) {
    errors.push('Valid startTime in HH:mm 24h format is required');
  }
  if (!endTime || !timeRegex.test(endTime)) {
    errors.push('Valid endTime in HH:mm 24h format is required');
  }

  if (startTime && endTime && startTime >= endTime) {
    errors.push('startTime must be earlier than endTime');
  }

  if (errors.length > 0) {
    throw new AppError(errors.join(', '), 400);
  }
};

module.exports = {
  validateCreateAppointment,
  validateUpdateStatus,
  validateRescheduleAppointment,
};
