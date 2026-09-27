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

/**
 * Register User Service
 */
const registerUser = async ({
  name,
  email,
  password,
  phone,
  role = 'RECEPTIONIST',
  specialization = 'General Medicine',
  qualification = 'MBBS',
  experienceYears = 3,
  licenseNumber,
  consultationFee = 500,
}) => {
  const cleanEmail = email.toLowerCase().trim();

  // 1. Check for existing user with this email
  const existingUser = await User.findOne({ email: cleanEmail });
  if (existingUser) {
    throw new AppError('An account with this email address already exists. Please sign in.', 409);
  }

  // 2. Validate role
  const assignedRole = ['ADMIN', 'DOCTOR', 'RECEPTIONIST'].includes(role) ? role : 'RECEPTIONIST';

  // 3. If DOCTOR, verify or generate licenseNumber
  let generatedLicense = licenseNumber ? licenseNumber.trim().toUpperCase() : null;
  if (assignedRole === 'DOCTOR') {
    if (generatedLicense) {
      const existingLicense = await Doctor.findOne({ licenseNumber: generatedLicense });
      if (existingLicense) {
        throw new AppError('A doctor with this license number already exists.', 409);
      }
    } else {
      // Auto-generate unique license code
      generatedLicense = `LIC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    }
  }

  // 4. Create the User record
  const user = await User.create({
    name: name.trim(),
    email: cleanEmail,
    password,
    phone: phone ? phone.trim() : undefined,
    role: assignedRole,
    isActive: true,
  });

  // 5. If DOCTOR, create linked Doctor profile
  let doctorProfile = null;
  if (assignedRole === 'DOCTOR') {
    doctorProfile = await Doctor.create({
      user: user._id,
      specialization: specialization.trim() || 'General Medicine',
      qualification: qualification.trim() || 'MBBS',
      experienceYears: Math.max(0, parseInt(experienceYears, 10) || 1),
      licenseNumber: generatedLicense,
      consultationFee: Math.max(0, parseFloat(consultationFee) || 500),
      isActive: true,
    });
  }

  // 6. Sign JWT token for immediate authenticated session
  const token = signToken(user._id, user.role);

  const userObj = user.toObject();
  delete userObj.password;

  return {
    token,
    user: userObj,
    doctor: doctorProfile,
  };
};

module.exports = {
  signToken,
  loginUser,
  registerUser,
  getCurrentUser,
};

