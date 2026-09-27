const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const DoctorSchedule = require('../models/DoctorSchedule');
const AppError = require('../utils/AppError');
const { generateAppointmentCode } = require('../utils/codeGenerators');
const {
  isIntervalOverlapping,
  getDayOfWeekFromDate,
} = require('../utils/slotGenerator');

/**
 * Validates doctor's working schedule for the requested date and time interval
 */
const validateScheduleCoverage = async (doctorId, dateObj, startTime, endTime) => {
  const dayOfWeek = getDayOfWeekFromDate(dateObj);

  const schedules = await DoctorSchedule.find({
    doctor: doctorId,
    dayOfWeek,
    isAvailable: true,
  });

  if (!schedules || schedules.length === 0) {
    throw new AppError(
      `Doctor does not have an active schedule on ${dayOfWeek}`,
      400
    );
  }

  // Check if requested time is covered by any active shift
  const matchingShift = schedules.find(
    (s) => startTime >= s.startTime && endTime <= s.endTime
  );

  if (!matchingShift) {
    const shiftRanges = schedules.map((s) => `${s.startTime}-${s.endTime}`).join(', ');
    throw new AppError(
      `Requested time ${startTime}-${endTime} is outside doctor's working shifts (${shiftRanges}) on ${dayOfWeek}`,
      400
    );
  }

  return matchingShift;
};

/**
 * Checks for interval overlap conflicts against existing appointments
 */
const checkIntervalOverlapConflict = async (doctorId, dateObj, startTime, endTime, excludeAppointmentId = null) => {
  // Normalize date to day range (start of day to end of day UTC)
  const startOfDay = new Date(dateObj);
  startOfDay.setUTCHours(0, 0, 0, 0);

  const endOfDay = new Date(dateObj);
  endOfDay.setUTCHours(23, 59, 59, 999);

  const query = {
    doctor: doctorId,
    appointmentDate: { $gte: startOfDay, $lte: endOfDay },
    status: { $nin: ['CANCELLED'] },
  };

  if (excludeAppointmentId) {
    query._id = { $ne: excludeAppointmentId };
  }

  const existingAppointments = await Appointment.find(query);

  for (const apt of existingAppointments) {
    if (isIntervalOverlapping(startTime, endTime, apt.startTime, apt.endTime)) {
      throw new AppError(
        `Time slot conflict: Doctor already has an appointment (${apt.appointmentCode}) scheduled from ${apt.startTime} to ${apt.endTime} on this date`,
        409
      );
    }
  }
};

/**
 * Books a new appointment with full interval overlap conflict detection
 */
const createAppointment = async (appointmentData, userId) => {
  const { patient: patientId, doctor: doctorId, appointmentDate, startTime, endTime, reason, notes } = appointmentData;

  // 1. Verify Patient exists and is active
  const patient = await Patient.findById(patientId);
  if (!patient) {
    throw new AppError('Patient not found', 404);
  }
  if (!patient.isActive) {
    throw new AppError('Cannot book appointment for inactive patient', 400);
  }

  // 2. Verify Doctor exists and is active
  const doctor = await Doctor.findById(doctorId).populate('user');
  if (!doctor) {
    throw new AppError('Doctor not found', 404);
  }
  if (!doctor.isActive) {
    throw new AppError('Cannot book appointment with inactive doctor', 400);
  }

  // 3. Normalize Date (UTC midnight)
  const aptDate = new Date(appointmentDate);
  aptDate.setUTCHours(0, 0, 0, 0);

  // 4. Verify Schedule Coverage
  await validateScheduleCoverage(doctorId, aptDate, startTime, endTime);

  // 5. Check for Interval Overlap Conflict (Double booking prevention)
  await checkIntervalOverlapConflict(doctorId, aptDate, startTime, endTime);

  // 6. Generate Sequential Appointment Code
  const count = await Appointment.countDocuments();
  const appointmentCode = generateAppointmentCode(count + 1, aptDate.getFullYear());

  // 7. Create Appointment
  const appointment = await Appointment.create({
    appointmentCode,
    patient: patientId,
    doctor: doctorId,
    appointmentDate: aptDate,
    startTime,
    endTime,
    status: 'SCHEDULED',
    reason,
    notes,
    createdBy: userId,
  });

  return await Appointment.findById(appointment._id)
    .populate('patient', 'patientCode name firstName lastName phone email gender dateOfBirth bloodGroup')
    .populate({
      path: 'doctor',
      populate: { path: 'user', select: 'name email phone' },
    })
    .populate('createdBy', 'name email role');
};

/**
 * Gets paginated and filtered appointments
 */
const getAppointments = async (queryParams, currentUser) => {
  const {
    page = 1,
    limit = 10,
    search,
    doctorId,
    patientId,
    status,
    startDate,
    endDate,
    date,
    sortBy = 'appointmentDate',
    sortOrder = 'desc',
  } = queryParams;

  const query = {};

  // If logged in as Doctor, restrict to doctor's own appointments unless queried by Admin/Receptionist
  if (currentUser && currentUser.role === 'DOCTOR') {
    const doctorProfile = await Doctor.findOne({ user: currentUser._id });
    if (doctorProfile) {
      query.doctor = doctorProfile._id;
    }
  } else if (doctorId) {
    query.doctor = doctorId;
  }

  if (patientId) {
    query.patient = patientId;
  }

  if (status) {
    query.status = status;
  }

  if (date) {
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setUTCHours(23, 59, 59, 999);
    query.appointmentDate = { $gte: startOfDay, $lte: endOfDay };
  } else if (startDate || endDate) {
    query.appointmentDate = {};
    if (startDate) {
      const sDate = new Date(startDate);
      sDate.setUTCHours(0, 0, 0, 0);
      query.appointmentDate.$gte = sDate;
    }
    if (endDate) {
      const eDate = new Date(endDate);
      eDate.setUTCHours(23, 59, 59, 999);
      query.appointmentDate.$lte = eDate;
    }
  }

  // Search by appointmentCode
  if (search) {
    query.$or = [
      { appointmentCode: { $regex: search, $options: 'i' } },
      { reason: { $regex: search, $options: 'i' } },
    ];
  }

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;
  const sortDirection = sortOrder === 'asc' ? 1 : -1;

  const [appointments, total] = await Promise.all([
    Appointment.find(query)
      .populate('patient', 'patientCode name firstName lastName phone email gender bloodGroup')
      .populate({
        path: 'doctor',
        populate: { path: 'user', select: 'name email phone' },
      })
      .populate('createdBy', 'name email role')
      .sort({ [sortBy]: sortDirection, startTime: sortDirection })
      .skip(skip)
      .limit(limitNum),
    Appointment.countDocuments(query),
  ]);

  return {
    appointments,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  };
};

/**
 * Gets appointment by ID
 */
const getAppointmentById = async (id) => {
  const appointment = await Appointment.findById(id)
    .populate('patient')
    .populate({
      path: 'doctor',
      populate: { path: 'user', select: 'name email phone' },
    })
    .populate('createdBy', 'name email role');

  if (!appointment) {
    throw new AppError('Appointment not found', 404);
  }

  return appointment;
};

/**
 * Updates appointment status with transition state machine validation
 */
const updateAppointmentStatus = async (id, status, notes = '') => {
  const appointment = await Appointment.findById(id);
  if (!appointment) {
    throw new AppError('Appointment not found', 404);
  }

  const currentStatus = appointment.status;

  // Terminal state checks
  if (currentStatus === 'COMPLETED') {
    throw new AppError('Completed appointments cannot be changed', 400);
  }
  if (currentStatus === 'CANCELLED') {
    throw new AppError('Cancelled appointments cannot be changed', 400);
  }

  // Allowed transitions
  const validTransitions = {
    SCHEDULED: ['CONFIRMED', 'CANCELLED', 'NO_SHOW'],
    CONFIRMED: ['COMPLETED', 'CANCELLED', 'NO_SHOW'],
    NO_SHOW: ['SCHEDULED', 'CANCELLED'],
  };

  if (!validTransitions[currentStatus]?.includes(status)) {
    throw new AppError(
      `Cannot transition appointment status from ${currentStatus} to ${status}`,
      400
    );
  }

  appointment.status = status;
  if (notes) {
    appointment.notes = notes;
  }

  await appointment.save();

  return await getAppointmentById(id);
};

/**
 * Reschedules appointment with interval overlap check
 */
const rescheduleAppointment = async (id, newDate, newStartTime, newEndTime, reason = '') => {
  const appointment = await Appointment.findById(id);
  if (!appointment) {
    throw new AppError('Appointment not found', 404);
  }

  if (appointment.status === 'COMPLETED') {
    throw new AppError('Completed appointments cannot be rescheduled', 400);
  }
  if (appointment.status === 'CANCELLED') {
    throw new AppError('Cancelled appointments cannot be rescheduled', 400);
  }

  const aptDate = new Date(newDate);
  aptDate.setUTCHours(0, 0, 0, 0);

  // Check schedule coverage on new day
  await validateScheduleCoverage(appointment.doctor, aptDate, newStartTime, newEndTime);

  // Check interval overlap excluding current appointment
  await checkIntervalOverlapConflict(appointment.doctor, aptDate, newStartTime, newEndTime, appointment._id);

  appointment.appointmentDate = aptDate;
  appointment.startTime = newStartTime;
  appointment.endTime = newEndTime;
  appointment.status = 'SCHEDULED'; // reset to scheduled
  if (reason) {
    appointment.notes = `Rescheduled: ${reason} | Previous: ${appointment.notes || ''}`;
  }

  await appointment.save();

  return await getAppointmentById(id);
};

/**
 * Cancels appointment
 */
const cancelAppointment = async (id, reason = '') => {
  return await updateAppointmentStatus(id, 'CANCELLED', reason ? `Cancellation reason: ${reason}` : undefined);
};

module.exports = {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointmentStatus,
  rescheduleAppointment,
  cancelAppointment,
};
