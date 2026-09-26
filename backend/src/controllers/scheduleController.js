const scheduleService = require('../services/scheduleService');
const { sendSuccess } = require('../utils/apiResponse');

const getDoctorSchedules = async (req, res, next) => {
  try {
    const result = await scheduleService.getDoctorSchedules(req.params.doctorId);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Doctor schedules retrieved successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const createSchedule = async (req, res, next) => {
  try {
    const schedule = await scheduleService.createSchedule(
      req.params.doctorId,
      req.body,
      req.user
    );
    return sendSuccess(res, {
      statusCode: 201,
      message: 'Doctor schedule created successfully',
      data: schedule,
    });
  } catch (error) {
    next(error);
  }
};

const updateSchedule = async (req, res, next) => {
  try {
    const schedule = await scheduleService.updateSchedule(
      req.params.id,
      req.body,
      req.user
    );
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Doctor schedule updated successfully',
      data: schedule,
    });
  } catch (error) {
    next(error);
  }
};

const deleteSchedule = async (req, res, next) => {
  try {
    const result = await scheduleService.deleteSchedule(req.params.id, req.user);
    return sendSuccess(res, {
      statusCode: 200,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

const getAvailableSlots = async (req, res, next) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    const result = await scheduleService.getAvailableSlots(doctorId, date);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Available slots computed successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDoctorSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getAvailableSlots,
};
