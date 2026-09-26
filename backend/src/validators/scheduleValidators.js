const AppError = require('../utils/AppError');

/**
 * Validator for Doctor Schedule Creation and Updates
 */
const validateScheduleInput = (req, res, next) => {
  const { dayOfWeek, startTime, endTime, slotDuration } = req.body;

  if (req.method === 'POST') {
    const validDays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
    if (!dayOfWeek || !validDays.includes(dayOfWeek.toUpperCase())) {
      return next(new AppError(`Day of week must be one of: ${validDays.join(', ')}`, 400));
    }

    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!startTime || !timeRegex.test(startTime)) {
      return next(new AppError('Start time must be in HH:mm 24-hour format (e.g. 09:00)', 400));
    }

    if (!endTime || !timeRegex.test(endTime)) {
      return next(new AppError('End time must be in HH:mm 24-hour format (e.g. 13:00)', 400));
    }

    if (startTime >= endTime) {
      return next(new AppError('Start time must be strictly before end time', 400));
    }

    if (slotDuration !== undefined && (isNaN(slotDuration) || Number(slotDuration) < 5)) {
      return next(new AppError('Slot duration must be at least 5 minutes', 400));
    }
  }

  if (req.method === 'PUT') {
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (startTime && !timeRegex.test(startTime)) {
      return next(new AppError('Start time must be in HH:mm 24-hour format', 400));
    }
    if (endTime && !timeRegex.test(endTime)) {
      return next(new AppError('End time must be in HH:mm 24-hour format', 400));
    }
    if (startTime && endTime && startTime >= endTime) {
      return next(new AppError('Start time must be strictly before end time', 400));
    }
    if (slotDuration !== undefined && (isNaN(slotDuration) || Number(slotDuration) < 5)) {
      return next(new AppError('Slot duration must be at least 5 minutes', 400));
    }
  }

  next();
};

/**
 * Validator for Available Slots Query
 */
const validateAvailableSlotsQuery = (req, res, next) => {
  const { date } = req.query;

  if (!date) {
    return next(new AppError("Query parameter 'date' is required in YYYY-MM-DD format", 400));
  }

  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) {
    return next(new AppError("Invalid date provided. Please use YYYY-MM-DD format (e.g. 2026-10-05)", 400));
  }

  next();
};

module.exports = {
  validateScheduleInput,
  validateAvailableSlotsQuery,
};
