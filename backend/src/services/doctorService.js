const { User, Doctor, DoctorSchedule } = require('../models');
const AppError = require('../utils/AppError');

/**
 * Get Paginated and Filtered Doctors List
 */
const getAllDoctors = async ({
  page = 1,
  limit = 10,
  search = '',
  specialization = '',
  isActive,
}) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;

  const doctorFilter = {};

  if (specialization && specialization.trim()) {
    doctorFilter.specialization = specialization.trim();
  }

  if (isActive !== undefined && isActive !== '') {
    doctorFilter.isActive = String(isActive) === 'true';
  }

  // Handle Search on Doctor Name or Qualification
  if (search && search.trim()) {
    const searchRegex = new RegExp(search.trim(), 'i');
    const matchedUsers = await User.find({
      name: searchRegex,
      role: 'DOCTOR',
    }).select('_id');

    const matchedUserIds = matchedUsers.map((u) => u._id);

    doctorFilter.$or = [
      { user: { $in: matchedUserIds } },
      { specialization: searchRegex },
      { qualification: searchRegex },
      { licenseNumber: searchRegex },
    ];
  }

  const [total, doctors] = await Promise.all([
    Doctor.countDocuments(doctorFilter),
    Doctor.find(doctorFilter)
      .populate('user', 'name email phone role isActive')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
  ]);

  return {
    doctors,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
    },
  };
};

/**
 * Get Doctor by ID with Active Weekly Schedules
 */
const getDoctorById = async (doctorId) => {
  const doctor = await Doctor.findById(doctorId).populate('user', 'name email phone role isActive');
  if (!doctor) {
    throw new AppError('Doctor not found with the requested ID', 404);
  }

  const schedules = await DoctorSchedule.find({ doctor: doctorId, isAvailable: true }).sort({
    dayOfWeek: 1,
    startTime: 1,
  });

  return {
    doctor,
    schedules,
  };
};

/**
 * Create New Doctor Profile with Linked User Account
 */
const createDoctor = async (doctorData) => {
  const {
    name,
    email,
    password,
    phone,
    specialization,
    qualification,
    experienceYears,
    licenseNumber,
    consultationFee,
  } = doctorData;

  // 1. Verify email uniqueness
  const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
  if (existingUser) {
    throw new AppError('An account with this email address already exists', 409);
  }

  // 2. Verify license number uniqueness
  const existingDoctor = await Doctor.findOne({
    licenseNumber: licenseNumber.toUpperCase().trim(),
  });
  if (existingDoctor) {
    throw new AppError('A doctor with this medical license number already exists', 409);
  }

  // 3. Create User Account
  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password: password,
    phone: phone ? phone.trim() : undefined,
    role: 'DOCTOR',
    isActive: true,
  });

  // 4. Create Doctor Profile linked to User
  const doctor = await Doctor.create({
    user: user._id,
    specialization: specialization.trim(),
    qualification: qualification.trim(),
    experienceYears: experienceYears ? parseInt(experienceYears, 10) : 0,
    licenseNumber: licenseNumber.toUpperCase().trim(),
    consultationFee: Number(consultationFee),
    isActive: true,
  });

  const populatedDoctor = await Doctor.findById(doctor._id).populate(
    'user',
    'name email phone role isActive'
  );

  return populatedDoctor;
};

/**
 * Update Doctor Profile
 */
const updateDoctor = async (doctorId, updateData) => {
  const doctor = await Doctor.findById(doctorId);
  if (!doctor) {
    throw new AppError('Doctor not found with the requested ID', 404);
  }

  // If user fields are provided, update user
  if (updateData.name || updateData.phone) {
    const userUpdates = {};
    if (updateData.name) userUpdates.name = updateData.name.trim();
    if (updateData.phone) userUpdates.phone = updateData.phone.trim();
    await User.findByIdAndUpdate(doctor.user, userUpdates);
  }

  // Update doctor profile fields
  const doctorUpdates = {};
  if (updateData.specialization) doctorUpdates.specialization = updateData.specialization.trim();
  if (updateData.qualification) doctorUpdates.qualification = updateData.qualification.trim();
  if (updateData.experienceYears !== undefined) doctorUpdates.experienceYears = parseInt(updateData.experienceYears, 10);
  if (updateData.consultationFee !== undefined) doctorUpdates.consultationFee = Number(updateData.consultationFee);

  const updatedDoctor = await Doctor.findByIdAndUpdate(doctorId, doctorUpdates, {
    new: true,
    runValidators: true,
  }).populate('user', 'name email phone role isActive');

  return updatedDoctor;
};

/**
 * Toggle Doctor Active Status
 */
const toggleDoctorStatus = async (doctorId, isActive) => {
  const doctor = await Doctor.findById(doctorId);
  if (!doctor) {
    throw new AppError('Doctor not found with the requested ID', 404);
  }

  const newStatus = isActive !== undefined ? isActive : !doctor.isActive;
  doctor.isActive = newStatus;
  await doctor.save();

  // Keep linked user account active status in sync
  await User.findByIdAndUpdate(doctor.user, { isActive: newStatus });

  return Doctor.findById(doctorId).populate('user', 'name email phone role isActive');
};

/**
 * Get Distinct Specializations
 */
const getDistinctSpecializations = async () => {
  const specializations = await Doctor.distinct('specialization', { isActive: true });
  return specializations;
};

module.exports = {
  getAllDoctors,
  getDoctorById,
  createDoctor,
  updateDoctor,
  toggleDoctorStatus,
  getDistinctSpecializations,
};
