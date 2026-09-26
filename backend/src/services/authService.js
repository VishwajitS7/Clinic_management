const jwt = require('jsonwebtoken');
const { User, Doctor } = require('../models');
const AppError = require('../utils/AppError');

/**
 * Sign JWT Token with minimal payload
 */
const signToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET || 'dev_jwt_secret_clinic_appointment_manager_2026_super_secure',
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    }
  );
};

/**
 * Login User Service
 */
const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  if (!user.isActive) {
    throw new AppError('Your account has been deactivated. Please contact the clinic administrator.', 403);
  }

  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) {
    throw new AppError('Invalid email or password', 401);
  }

  const token = signToken(user._id, user.role);

  // Exclude password from returned user object
  const userObj = user.toObject();
  delete userObj.password;

  let doctorProfile = null;
  if (user.role === 'DOCTOR') {
    doctorProfile = await Doctor.findOne({ user: user._id });
  }

  return {
    token,
    user: userObj,
    doctor: doctorProfile,
  };
};

/**
 * Get Current User Profile Service
 */
const getCurrentUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  let doctorProfile = null;
  if (user.role === 'DOCTOR') {
    doctorProfile = await Doctor.findOne({ user: user._id });
  }

  return {
    user,
    doctor: doctorProfile,
  };
};

module.exports = {
  signToken,
  loginUser,
  getCurrentUser,
};
