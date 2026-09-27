const appointmentService = require('../services/appointmentService');
const {
  validateCreateAppointment,
  validateUpdateStatus,
  validateRescheduleAppointment,
} = require('../validators/appointmentValidators');
const { sendSuccess } = require('../utils/apiResponse');

/**
 * Create new appointment
 */
const createAppointment = async (req, res, next) => {
  try {
    validateCreateAppointment(req.body);
    const appointment = await appointmentService.createAppointment(req.body, req.user._id);
    return sendSuccess(res, {
      statusCode: 201,
      message: 'Appointment booked successfully',
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all appointments with filters
 */
const getAppointments = async (req, res, next) => {
  try {
    const result = await appointmentService.getAppointments(req.query, req.user);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Appointments retrieved successfully',
      data: result.appointments,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get appointment by ID
 */
const getAppointmentById = async (req, res, next) => {
  try {
    const appointment = await appointmentService.getAppointmentById(req.params.id);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Appointment retrieved successfully',
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update appointment status
 */
const updateAppointmentStatus = async (req, res, next) => {
  try {
    validateUpdateStatus(req.body);
    const appointment = await appointmentService.updateAppointmentStatus(
      req.params.id,
      req.body.status,
      req.body.notes
    );
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Appointment status updated successfully',
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reschedule appointment
 */
const rescheduleAppointment = async (req, res, next) => {
  try {
    validateRescheduleAppointment(req.body);
    const appointment = await appointmentService.rescheduleAppointment(
      req.params.id,
      req.body.appointmentDate,
      req.body.startTime,
      req.body.endTime,
      req.body.reason
    );
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Appointment rescheduled successfully',
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel appointment
 */
const cancelAppointment = async (req, res, next) => {
  try {
    const appointment = await appointmentService.cancelAppointment(
      req.params.id,
      req.body.reason
    );
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Appointment cancelled successfully',
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointmentStatus,
  rescheduleAppointment,
  cancelAppointment,
};
