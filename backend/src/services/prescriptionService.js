const Prescription = require('../models/Prescription');
const Consultation = require('../models/Consultation');
const Doctor = require('../models/Doctor');
const AppError = require('../utils/AppError');

/**
 * Creates a new prescription linked to a consultation
 */
const createPrescription = async (data, currentUser) => {
  const { consultationId, items, instructions } = data;

  // 1. Fetch consultation
  const consultation = await Consultation.findById(consultationId).populate({
    path: 'doctor',
    populate: { path: 'user', select: '_id name' },
  });

  if (!consultation) {
    throw new AppError('Consultation record not found', 404);
  }

  // 2. Doctor authorization check
  if (currentUser.role === 'DOCTOR') {
    const doctorProfile = await Doctor.findOne({ user: currentUser._id });
    if (!doctorProfile || String(consultation.doctor._id) !== String(doctorProfile._id)) {
      throw new AppError('You can only issue prescriptions for your own consultations', 403);
    }
  }

  // 3. Verify no existing prescription
  const existing = await Prescription.findOne({ consultation: consultationId });
  if (existing) {
    throw new AppError('A prescription has already been issued for this consultation', 409);
  }

  // 4. Create prescription
  const prescription = await Prescription.create({
    consultation: consultation._id,
    doctor: consultation.doctor._id,
    patient: consultation.patient,
    items,
    instructions,
  });

  return await getPrescriptionById(prescription._id);
};

/**
 * Gets paginated prescriptions
 */
const getPrescriptions = async (queryParams, currentUser) => {
  const {
    page = 1,
    limit = 10,
    search,
    doctorId,
    patientId,
    sortBy = 'prescriptionDate',
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
      { 'items.medicineName': { $regex: search, $options: 'i' } },
      { instructions: { $regex: search, $options: 'i' } },
    ];
  }

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;
  const sortDirection = sortOrder === 'asc' ? 1 : -1;

  const [prescriptions, total] = await Promise.all([
    Prescription.find(query)
      .populate('patient', 'patientCode name firstName lastName phone email gender bloodGroup')
      .populate({
        path: 'doctor',
        populate: { path: 'user', select: 'name email' },
      })
      .populate({
        path: 'consultation',
        select: 'diagnosis symptoms followUpDate createdAt',
        populate: { path: 'appointment', select: 'appointmentCode' },
      })
      .sort({ [sortBy]: sortDirection })
      .skip(skip)
      .limit(limitNum),
    Prescription.countDocuments(query),
  ]);

  return {
    prescriptions,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  };
};

/**
 * Gets prescription by ID
 */
const getPrescriptionById = async (id) => {
  const prescription = await Prescription.findById(id)
    .populate('patient')
    .populate({
      path: 'doctor',
      populate: { path: 'user', select: 'name email phone' },
    })
    .populate({
      path: 'consultation',
      populate: { path: 'appointment' },
    });

  if (!prescription) {
    throw new AppError('Prescription record not found', 404);
  }

  return prescription;
};

/**
 * Gets prescription by consultation ID
 */
const getPrescriptionByConsultationId = async (consultationId) => {
  const prescription = await Prescription.findOne({ consultation: consultationId })
    .populate('patient')
    .populate({
      path: 'doctor',
      populate: { path: 'user', select: 'name email phone' },
    })
    .populate({
      path: 'consultation',
      populate: { path: 'appointment' },
    });

  return prescription || null;
};

/**
 * Updates prescription
 */
const updatePrescription = async (id, updateData, currentUser) => {
  const prescription = await Prescription.findById(id).populate({
    path: 'doctor',
    populate: { path: 'user', select: '_id' },
  });

  if (!prescription) {
    throw new AppError('Prescription record not found', 404);
  }

  if (currentUser.role === 'DOCTOR') {
    if (String(prescription.doctor.user._id) !== String(currentUser._id)) {
      throw new AppError('You can only update your own issued prescriptions', 403);
    }
  }

  if (updateData.items) {
    prescription.items = updateData.items;
  }
  if (updateData.instructions !== undefined) {
    prescription.instructions = updateData.instructions;
  }

  await prescription.save();
  return await getPrescriptionById(id);
};

module.exports = {
  createPrescription,
  getPrescriptions,
  getPrescriptionById,
  getPrescriptionByConsultationId,
  updatePrescription,
};
