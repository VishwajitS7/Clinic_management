/**
 * Unified API Response Formatter
 * Strict compliance with project response schema:
 * Success: { success: true, message, data, pagination? }
 * Error:   { success: false, message, errors? }
 */

const sendSuccess = (res, { statusCode = 200, message = 'Success', data = undefined, pagination = undefined }) => {
  const response = {
    success: true,
  };

  if (message) {
    response.message = message;
  }

  if (data !== undefined) {
    response.data = data;
  }

  if (pagination) {
    response.pagination = pagination;
  }

  return res.status(statusCode).json(response);
};

const sendError = (res, { statusCode = 500, message = 'Internal Server Error', errors = undefined }) => {
  const response = {
    success: false,
    message,
  };

  if (errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

module.exports = {
  sendSuccess,
  sendError,
};
