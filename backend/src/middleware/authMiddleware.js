const jwt = require('jsonwebtoken');
const { User, Doctor } = require('../models');
const AppError = require('../utils/AppError');

/**
 * Authentication Middleware: Verifies JWT token and attaches user to request
 */
const authenticateUser = async (req, res, next) => {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('You are not authenticated. Please log in to gain access.', 401));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_jwt_secret_clinic_appointment_manager_2026_super_secure');

    const currentUser = await User.findById(decoded.userId);
    if (!currentUser) {
      return next(new AppError('The user belonging to this token no longer exists.', 401));
    }

    if (!currentUser.isActive) {
      return next(new AppError('This user account has been deactivated.', 403));
    }

    // Attach user to request
    req.user = currentUser;

    // If the user is a doctor, pre-load their doctor profile reference
    if (currentUser.role === 'DOCTOR') {
      const doctorProfile = await Doctor.findOne({ user: currentUser._id });
      req.doctor = doctorProfile;
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Authorization Middleware: Restricts route to specific user roles
 * @param  {...string} roles - e.g. 'ADMIN', 'DOCTOR', 'RECEPTIONIST'
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new AppError(
          `Access denied. Role '${req.user?.role || 'ANONYMOUS'}' does not have permission for this resource.`,
          403
        )
      );
    }
    next();
  };
};

module.exports = {
  authenticateUser,
  authorizeRoles,
};
