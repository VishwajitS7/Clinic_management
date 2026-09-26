const { Doctor, DoctorSchedule, Appointment } = require('../models');
const AppError = require('../utils/AppError');
const {
  generateSlotsForSchedule,
  getDayOfWeekFromDate,
  isIntervalOverlapping,
} = require('../utils/slotGenerator');

/**
 * Get all schedules configured for a specific doctor
 */
const getDoctorSchedules = async (doctorId) => {
  const doctor = await Doctor.findById(doctorId).populate('user', 'name');
  if (!doctor) {
    throw new AppError('Doctor not found with the requested ID', 404);
  }

  const schedules = await DoctorSchedule.find({ doctor: doctorId }).sort({
    dayOfWeek: 1,
    startTime: 1,
  });

  return {
    doctor: {
      id: doctor._id,
      name: doctor.user?.name,
    },
    schedules,
  };
};

/**
 * Create a new schedule block for a doctor
 * Enforces:
 * - Admin or owning Doctor only
 * - No overlapping schedules on the same day
 */
const createSchedule = async (doctorId, scheduleData, requestingUser) => {
  const doctor = await Doctor.findById(doctorId);
  if (!doctor) {
    throw new AppError('Doctor not found with the requested ID', 404);
  }

  // Ownership Check: Doctor can only modify their own schedule
  if (requestingUser.role === 'DOCTOR' && String(doctor.user) !== String(requestingUser._id)) {
    throw new AppError("Access denied. You cannot modify another doctor's schedule.", 403);
  }

  const dayOfWeek = scheduleData.dayOfWeek.toUpperCase().trim();
  const startTime = scheduleData.startTime.trim();
  const endTime = scheduleData.endTime.trim();
  const slotDuration = scheduleData.slotDuration ? Number(scheduleData.slotDuration) : 30;

  // Check for overlapping schedule intervals for this doctor on this day
  const existingSchedules = await DoctorSchedule.find({
    doctor: doctorId,
    dayOfWeek,
    isAvailable: true,
  });

  const hasOverlap = existingSchedules.some((s) =>
    isIntervalOverlapping(startTime, endTime, s.startTime, s.endTime)
  );

  if (hasOverlap) {
    throw new AppError(
      `Schedule interval ${startTime} - ${endTime} overlaps with an existing schedule for ${dayOfWeek}.`,
      409
    );
  }

  const schedule = await DoctorSchedule.create({
    doctor: doctorId,
    dayOfWeek,
    startTime,
    endTime,
    slotDuration,
    isAvailable: scheduleData.isAvailable !== undefined ? scheduleData.isAvailable : true,
  });

  return schedule;
};

/**
 * Update an existing schedule block
 */
const updateSchedule = async (scheduleId, updateData, requestingUser) => {
  const schedule = await DoctorSchedule.findById(scheduleId);
  if (!schedule) {
    throw new AppError('Schedule block not found', 404);
  }

  const doctor = await Doctor.findById(schedule.doctor);
  if (requestingUser.role === 'DOCTOR' && String(doctor.user) !== String(requestingUser._id)) {
    throw new AppError("Access denied. You cannot modify another doctor's schedule.", 403);
  }

  const newDay = updateData.dayOfWeek ? updateData.dayOfWeek.toUpperCase().trim() : schedule.dayOfWeek;
  const newStart = updateData.startTime ? updateData.startTime.trim() : schedule.startTime;
  const newEnd = updateData.endTime ? updateData.endTime.trim() : schedule.endTime;

  // Check for overlap with doctor's other schedules on that day
  const existingSchedules = await DoctorSchedule.find({
    _id: { $ne: scheduleId },
    doctor: schedule.doctor,
    dayOfWeek: newDay,
    isAvailable: true,
  });

  const hasOverlap = existingSchedules.some((s) =>
    isIntervalOverlapping(newStart, newEnd, s.startTime, s.endTime)
  );

  if (hasOverlap) {
    throw new AppError(
      `Updated timing ${newStart} - ${newEnd} overlaps with an existing schedule on ${newDay}.`,
      409
    );
  }

  if (updateData.dayOfWeek) schedule.dayOfWeek = newDay;
  if (updateData.startTime) schedule.startTime = newStart;
  if (updateData.endTime) schedule.endTime = newEnd;
  if (updateData.slotDuration) schedule.slotDuration = Number(updateData.slotDuration);
  if (updateData.isAvailable !== undefined) schedule.isAvailable = updateData.isAvailable;

  await schedule.save();
  return schedule;
};

/**
 * Delete a schedule block
 */
const deleteSchedule = async (scheduleId, requestingUser) => {
  const schedule = await DoctorSchedule.findById(scheduleId);
  if (!schedule) {
    throw new AppError('Schedule block not found', 404);
  }

  const doctor = await Doctor.findById(schedule.doctor);
  if (requestingUser.role === 'DOCTOR' && String(doctor.user) !== String(requestingUser._id)) {
    throw new AppError("Access denied. You cannot delete another doctor's schedule.", 403);
  }

  await DoctorSchedule.findByIdAndDelete(scheduleId);
  return { message: 'Schedule block deleted successfully' };
};

/**
 * Section 15: Available Slot API
 * Computes real-time slot availability for a doctor on a target date
 */
const getAvailableSlots = async (doctorId, dateString) => {
  const doctor = await Doctor.findById(doctorId).populate('user', 'name');
  if (!doctor) {
    throw new AppError('Doctor not found with the requested ID', 404);
  }

  if (!doctor.isActive) {
    throw new AppError('Doctor is currently inactive and cannot take appointments', 400);
  }

  // Determine Day of Week for the target date
  const dayOfWeek = getDayOfWeekFromDate(dateString);

  // Find active schedules for this doctor on this day
  const schedules = await DoctorSchedule.find({
    doctor: doctorId,
    dayOfWeek,
    isAvailable: true,
  }).sort({ startTime: 1 });

  // Query booked appointments for that doctor on target date
  // Parse whole day boundary in UTC
  const startOfDay = new Date(`${dateString}T00:00:00.000Z`);
  const endOfDay = new Date(`${dateString}T23:59:59.999Z`);

  const bookedAppointments = await Appointment.find({
    doctor: doctorId,
    appointmentDate: { $gte: startOfDay, $lte: endOfDay },
    status: { $ne: 'CANCELLED' },
  }).select('startTime endTime status');

  // Generate slots for each schedule block on that day
  let allSlots = [];
  for (const schedule of schedules) {
    const slots = generateSlotsForSchedule(schedule, bookedAppointments);
    allSlots = allSlots.concat(slots);
  }

  // Sort slots by startTime
  allSlots.sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Section 15 exact response structure
  return {
    doctor: {
      id: doctor._id,
      name: doctor.user?.name,
      specialization: doctor.specialization,
      consultationFee: doctor.consultationFee,
    },
    date: dateString,
    dayOfWeek,
    slots: allSlots,
  };
};

module.exports = {
  getDoctorSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getAvailableSlots,
};
