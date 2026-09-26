const {
  Patient,
  Appointment,
  Consultation,
  Prescription,
  Invoice,
  Payment,
} = require('../models');
const AppError = require('../utils/AppError');
const { generatePatientCode } = require('../utils/codeGenerators');

/**
 * Get Paginated and Filtered Patients
 */
const getAllPatients = async ({
  page = 1,
  limit = 10,
  search = '',
  gender = '',
  bloodGroup = '',
  isActive,
}) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;

  const filter = {};

  if (search && search.trim()) {
    const searchRegex = new RegExp(search.trim(), 'i');
    filter.$or = [
      { name: searchRegex },
      { phone: searchRegex },
      { email: searchRegex },
      { patientCode: searchRegex },
    ];
  }

  if (gender && gender.trim()) {
    filter.gender = gender.trim().toUpperCase();
  }

  if (bloodGroup && bloodGroup.trim()) {
    filter.bloodGroup = bloodGroup.trim().toUpperCase();
  }

  if (isActive !== undefined && isActive !== '') {
    filter.isActive = String(isActive) === 'true';
  }

  const [total, patients] = await Promise.all([
    Patient.countDocuments(filter),
    Patient.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
  ]);

  return {
    patients,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
    },
  };
};

/**
 * Get Comprehensive Patient Dossier with Linked Clinical Records (Section 33)
 */
const getPatientById = async (patientId) => {
  const patient = await Patient.findById(patientId);
  if (!patient) {
    throw new AppError('Patient not found with the requested ID', 404);
  }

  // Fetch full clinical dossier associated with this patient
  const [appointments, consultations, prescriptions, invoices] = await Promise.all([
    Appointment.find({ patient: patientId })
      .populate({
        path: 'doctor',
        populate: { path: 'user', select: 'name email' },
      })
      .sort({ appointmentDate: -1, startTime: -1 }),

    Consultation.find({ patient: patientId })
      .populate('appointment', 'appointmentCode appointmentDate')
      .populate({
        path: 'doctor',
        populate: { path: 'user', select: 'name' },
      })
      .sort({ createdAt: -1 }),

    Prescription.find({ patient: patientId })
      .populate({
        path: 'doctor',
        populate: { path: 'user', select: 'name' },
      })
      .sort({ prescriptionDate: -1 }),

    Invoice.find({ patient: patientId })
      .populate('appointment', 'appointmentCode appointmentDate')
      .sort({ createdAt: -1 }),
  ]);

  // Fetch payments for all invoices belonging to this patient
  const invoiceIds = invoices.map((inv) => inv._id);
  const payments = await Payment.find({ invoice: { $in: invoiceIds } })
    .populate('invoice', 'invoiceNumber totalAmount')
    .sort({ paidAt: -1 });

  return {
    patient,
    appointments,
    consultations,
    prescriptions,
    invoices,
    payments,
  };
};

/**
 * Create New Patient with Automatic Patient Code Generation
 */
const createPatient = async (patientData) => {
  // If no patientCode provided, generate the next sequential code
  if (!patientData.patientCode) {
    const count = await Patient.countDocuments();
    let seq = count + 1;
    let candidateCode = generatePatientCode(seq);

    // Ensure uniqueness in case of deleted records
    while (await Patient.exists({ patientCode: candidateCode })) {
      seq += 1;
      candidateCode = generatePatientCode(seq);
    }
    patientData.patientCode = candidateCode;
  }

  // Normalize email and gender
  if (patientData.email) patientData.email = patientData.email.toLowerCase().trim();
  if (patientData.gender) patientData.gender = patientData.gender.toUpperCase().trim();
  if (patientData.bloodGroup) patientData.bloodGroup = patientData.bloodGroup.toUpperCase().trim();

  const patient = await Patient.create(patientData);
  return patient;
};

/**
 * Update Existing Patient
 */
const updatePatient = async (patientId, updateData) => {
  // Disallow direct modification of patientCode
  delete updateData.patientCode;

  if (updateData.email) updateData.email = updateData.email.toLowerCase().trim();
  if (updateData.gender) updateData.gender = updateData.gender.toUpperCase().trim();
  if (updateData.bloodGroup) updateData.bloodGroup = updateData.bloodGroup.toUpperCase().trim();

  const patient = await Patient.findByIdAndUpdate(patientId, updateData, {
    new: true,
    runValidators: true,
  });

  if (!patient) {
    throw new AppError('Patient not found with the requested ID', 404);
  }

  return patient;
};

/**
 * Toggle Patient Active / Inactive Status
 */
const togglePatientStatus = async (patientId, isActive) => {
  const patient = await Patient.findById(patientId);
  if (!patient) {
    throw new AppError('Patient not found with the requested ID', 404);
  }

  patient.isActive = isActive !== undefined ? isActive : !patient.isActive;
  await patient.save();

  return patient;
};

module.exports = {
  getAllPatients,
  getPatientById,
  createPatient,
  updatePatient,
  togglePatientStatus,
};
