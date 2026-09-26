const AppError = require('../utils/AppError');

/**
 * Validation middleware for Patient Creation and Updates
 */
const validatePatientInput = (req, res, next) => {
  const { name, dateOfBirth, gender, phone, email } = req.body;

  if (req.method === 'POST') {
    if (!name || !name.trim()) {
      return next(new AppError('Patient name is required', 400));
    }

    if (!dateOfBirth) {
      return next(new AppError('Date of birth is required', 400));
    }

    if (isNaN(new Date(dateOfBirth).getTime())) {
      return next(new AppError('Invalid date of birth provided', 400));
    }

    const validGenders = ['MALE', 'FEMALE', 'OTHER'];
    if (!gender || !validGenders.includes(gender.toUpperCase())) {
      return next(new AppError(`Gender must be one of: ${validGenders.join(', ')}`, 400));
    }

    if (!phone || !phone.trim()) {
      return next(new AppError('Contact phone number is required', 400));
    }
  }

  // Validate email format if provided
  if (email && email.trim()) {
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email.trim())) {
      return next(new AppError('Please provide a valid email address', 400));
    }
  }

  next();
};

module.exports = {
  validatePatientInput,
};
