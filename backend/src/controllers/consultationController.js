const consultationService = require('../services/consultationService');
const {
  validateCreateConsultation,
  validateUpdateConsultation,
} = require('../validators/consultationValidators');
const { sendSuccess } = require('../utils/apiResponse');

/**
 * Record a new consultation
 */
const createConsultation = async (req, res, next) => {
  try {
    validateCreateConsultation(req.body);
    const consultation = await consultationService.createConsultation(req.body, req.user);
    return sendSuccess(res, {
      statusCode: 201,
      message: 'Consultation recorded successfully and appointment marked as completed',
      data: consultation,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all consultations with filters
 */
const getConsultations = async (req, res, next) => {
  try {
    const result = await consultationService.getConsultations(req.query, req.user);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Consultations retrieved successfully',
      data: result.consultations,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get consultation by ID
 */
const getConsultationById = async (req, res, next) => {
  try {
    const consultation = await consultationService.getConsultationById(req.params.id);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Consultation details retrieved successfully',
      data: consultation,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get consultation by Appointment ID
 */
const getConsultationByAppointmentId = async (req, res, next) => {
  try {
    const consultation = await consultationService.getConsultationByAppointmentId(req.params.appointmentId);
    return sendSuccess(res, {
      statusCode: 200,
      message: consultation ? 'Consultation found for appointment' : 'No consultation recorded yet',
      data: consultation,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update consultation
 */
const updateConsultation = async (req, res, next) => {
  try {
    validateUpdateConsultation(req.body);
    const consultation = await consultationService.updateConsultation(
      req.params.id,
      req.body,
      req.user
    );
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Consultation updated successfully',
      data: consultation,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createConsultation,
  getConsultations,
  getConsultationById,
  getConsultationByAppointmentId,
  updateConsultation,
};
