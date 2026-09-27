const Consultation = require('../models/Consultation');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Prescription = require('../models/Prescription');
const AppError = require('../utils/AppError');

/**
 * Creates a consultation record and marks appointment as COMPLETED
 */
const createConsultation = async (data, currentUser) => {
  const { appointmentId, symptoms, diagnosis, clinicalNotes, followUpDate } = data;

  // 1. Fetch appointment
  const appointment = await Appointment.findById(appointmentId).populate({
    path: 'doctor',
    populate: { path: 'user', select: '_id name email' },
  });

  if (!appointment) {
    throw new AppError('Appointment not found', 404);
  }

  // 2. Validate appointment status
  if (appointment.status === 'CANCELLED') {
    throw new AppError('Cannot conduct consultation on a cancelled appointment', 400);
  }
  if (appointment.status === 'NO_SHOW') {
    throw new AppError('Cannot conduct consultation for a no-show appointment', 400);
  }

  // 3. Verify doctor role authorization
  if (currentUser.role === 'DOCTOR') {
    const doctorProfile = await Doctor.findOne({ user: currentUser._id });
    if (!doctorProfile || String(appointment.doctor._id) !== String(doctorProfile._id)) {
      throw new AppError('You are only authorized to consult for your own assigned appointments', 403);
    }
  }

  // 4. Check if consultation already exists for this appointment
  const existingConsultation = await Consultation.findOne({ appointment: appointmentId });
  if (existingConsultation) {
    throw new AppError('A consultation has already been recorded for this appointment', 409);
  }

  // 5. Create consultation record
  const consultation = await Consultation.create({
    appointment: appointment._id,
    doctor: appointment.doctor._id,
    patient: appointment.patient,
    symptoms,
    diagnosis,
    clinicalNotes,
    followUpDate: followUpDate ? new Date(followUpDate) : undefined,
  });

  // 6. Transition appointment to COMPLETED status
  appointment.status = 'COMPLETED';
  await appointment.save();

  return await getConsultationById(consultation._id);
};

/**
 * Gets paginated consultations
 */
const getConsultations = async (queryParams, currentUser) => {
  const {
    page = 1,
    limit = 10,
    search,
    doctorId,
    patientId,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = queryParams;

  const query = {};

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

  if (search) {
    query.$or = [
      { diagnosis: { $regex: search, $options: 'i' } },
      { symptoms: { $regex: search, $options: 'i' } },
    ];
  }

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;
  const sortDirection = sortOrder === 'asc' ? 1 : -1;

  const [consultations, total] = await Promise.all([
    Consultation.find(query)
      .populate('patient', 'patientCode name firstName lastName phone email gender bloodGroup')
      .populate({
        path: 'doctor',
        populate: { path: 'user', select: 'name email' },
      })
      .populate('appointment', 'appointmentCode appointmentDate startTime endTime status')
      .sort({ [sortBy]: sortDirection })
      .skip(skip)
      .limit(limitNum),
    Consultation.countDocuments(query),
  ]);

  return {
    consultations,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  };
};

/**
 * Gets consultation by ID with linked prescription
 */
const getConsultationById = async (id) => {
  const consultation = await Consultation.findById(id)
    .populate('patient')
    .populate({
      path: 'doctor',
      populate: { path: 'user', select: 'name email phone' },
    })
    .populate('appointment');

  if (!consultation) {
    throw new AppError('Consultation record not found', 404);
  }

  // Also query if a prescription exists for this consultation
  const prescription = await Prescription.findOne({ consultation: consultation._id });

  const consultationObj = consultation.toObject();
  consultationObj.prescription = prescription || null;

  return consultationObj;
};

/**
 * Gets consultation by appointment ID
 */
const getConsultationByAppointmentId = async (appointmentId) => {
  const consultation = await Consultation.findOne({ appointment: appointmentId })
    .populate('patient')
    .populate({
      path: 'doctor',
      populate: { path: 'user', select: 'name email phone' },
    })
    .populate('appointment');

  if (!consultation) {
    return null;
  }

  const prescription = await Prescription.findOne({ consultation: consultation._id });
  const consultationObj = consultation.toObject();
  consultationObj.prescription = prescription || null;

  return consultationObj;
};

/**
 * Updates an existing consultation
 */
const updateConsultation = async (id, updateData, currentUser) => {
  const consultation = await Consultation.findById(id).populate({
    path: 'doctor',
    populate: { path: 'user', select: '_id' },
  });

  if (!consultation) {
    throw new AppError('Consultation record not found', 404);
  }

  if (currentUser.role === 'DOCTOR') {
    if (String(consultation.doctor.user._id) !== String(currentUser._id)) {
      throw new AppError('You can only update your own consultation records', 403);
    }
  }

  const allowedFields = ['symptoms', 'diagnosis', 'clinicalNotes', 'followUpDate'];
  allowedFields.forEach((field) => {
    if (updateData[field] !== undefined) {
      consultation[field] = updateData[field];
    }
  });

  await consultation.save();
  return await getConsultationById(id);
};

module.exports = {
  createConsultation,
  getConsultations,
  getConsultationById,
  getConsultationByAppointmentId,
  updateConsultation,
};
