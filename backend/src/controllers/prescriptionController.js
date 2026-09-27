const prescriptionService = require('../services/prescriptionService');
const {
  validateCreatePrescription,
  validateUpdatePrescription,
} = require('../validators/prescriptionValidators');
const { sendSuccess } = require('../utils/apiResponse');

/**
 * Issue new prescription
 */
const createPrescription = async (req, res, next) => {
  try {
    validateCreatePrescription(req.body);
    const prescription = await prescriptionService.createPrescription(req.body, req.user);
    return sendSuccess(res, {
      statusCode: 201,
      message: 'Prescription issued successfully',
      data: prescription,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all prescriptions with filters
 */
const getPrescriptions = async (req, res, next) => {
  try {
    const result = await prescriptionService.getPrescriptions(req.query, req.user);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Prescriptions retrieved successfully',
      data: result.prescriptions,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get prescription by ID
 */
const getPrescriptionById = async (req, res, next) => {
  try {
    const prescription = await prescriptionService.getPrescriptionById(req.params.id);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Prescription details retrieved successfully',
      data: prescription,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get prescription by consultation ID
 */
const getPrescriptionByConsultationId = async (req, res, next) => {
  try {
    const prescription = await prescriptionService.getPrescriptionByConsultationId(
      req.params.consultationId
    );
    return sendSuccess(res, {
      statusCode: 200,
      message: prescription ? 'Prescription found' : 'No prescription issued for this consultation',
      data: prescription,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update prescription
 */
const updatePrescription = async (req, res, next) => {
  try {
    validateUpdatePrescription(req.body);
    const prescription = await prescriptionService.updatePrescription(
      req.params.id,
      req.body,
      req.user
    );
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Prescription updated successfully',
      data: prescription,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPrescription,
  getPrescriptions,
  getPrescriptionById,
  getPrescriptionByConsultationId,
  updatePrescription,
};
