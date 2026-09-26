const AppError = require('../utils/AppError');

/**
 * Validation middleware for Doctor Creation and Updates
 */
const validateDoctorInput = (req, res, next) => {
  const {
    name,
    email,
    password,
    specialization,
    qualification,
    licenseNumber,
    consultationFee,
  } = req.body;

  if (req.method === 'POST') {
    if (!name || !name.trim()) {
      return next(new AppError('Doctor name is required', 400));
    }

    if (!email || !email.trim()) {
      return next(new AppError('Doctor email is required', 400));
    }

    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email.trim())) {
      return next(new AppError('Please provide a valid email address', 400));
    }

    if (!password || password.length < 6) {
      return next(new AppError('Temporary password must be at least 6 characters long', 400));
    }

    if (!specialization || !specialization.trim()) {
      return next(new AppError('Medical specialization is required', 400));
    }

    if (!qualification || !qualification.trim()) {
      return next(new AppError('Qualifications are required (e.g. MBBS, MD)', 400));
    }

    if (!licenseNumber || !licenseNumber.trim()) {
      return next(new AppError('Medical license number is required', 400));
    }

    if (consultationFee === undefined || isNaN(consultationFee) || Number(consultationFee) < 0) {
      return next(new AppError('Consultation fee must be a non-negative number', 400));
    }
  }

  if (req.method === 'PUT') {
    if (consultationFee !== undefined && (isNaN(consultationFee) || Number(consultationFee) < 0)) {
      return next(new AppError('Consultation fee must be a non-negative number', 400));
    }
  }

  next();
};

module.exports = {
  validateDoctorInput,
};
