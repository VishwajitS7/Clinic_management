/**
 * Authentication and User Input Validators
 */
const AppError = require('../utils/AppError');

const validateLoginInput = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Please provide both email and password', 400));
  }

  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  if (!emailRegex.test(email)) {
    return next(new AppError('Please provide a valid email address', 400));
  }

  next();
};

const validateRegisterInput = (req, res, next) => {
  const { name, email, password, role } = req.body;

  if (!name || !name.trim()) {
    return next(new AppError('Full name is required', 400));
  }

  if (name.trim().length < 2 || name.trim().length > 100) {
    return next(new AppError('Name must be between 2 and 100 characters', 400));
  }

  if (!email || !email.trim()) {
    return next(new AppError('Email address is required', 400));
  }

  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  if (!emailRegex.test(email.trim())) {
    return next(new AppError('Please provide a valid email address', 400));
  }

  if (!password || password.length < 6) {
    return next(new AppError('Password must be at least 6 characters long', 400));
  }

  if (role && !['ADMIN', 'DOCTOR', 'RECEPTIONIST'].includes(role)) {
    return next(new AppError('Role must be one of ADMIN, DOCTOR, or RECEPTIONIST', 400));
  }

  next();
};

module.exports = {
  validateLoginInput,
  validateRegisterInput,
};

