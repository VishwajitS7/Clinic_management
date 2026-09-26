const AppError = require('../utils/AppError');
const { sendError } = require('../utils/apiResponse');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const field = Object.keys(err.keyValue || {})[0] || 'field';
  const value = err.keyValue ? err.keyValue[field] : '';
  const message = `Duplicate value '${value}' for field '${field}'. Please use another value.`;
  return new AppError(message, 409);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Validation failed: ${errors.join('. ')}`;
  return new AppError(message, 400, errors);
};

const handleJWTError = () => new AppError('Invalid authentication token. Please log in again.', 401);

const handleJWTExpiredError = () => new AppError('Your authentication token has expired. Please log in again.', 401);

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || 500;
  error.isOperational = err.isOperational || false;

  // Log server errors for debugging
  if (error.statusCode >= 500) {
    console.error(' [Unhandled Server Error]:', err);
  }

  // Handle known Mongoose / Database / Security error scenarios
  if (err.name === 'CastError') error = handleCastErrorDB(err);
  if (err.code === 11000) error = handleDuplicateFieldsDB(err);
  if (err.name === 'ValidationError') error = handleValidationErrorDB(err);
  if (err.name === 'JsonWebTokenError') error = handleJWTError();
  if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();

  const statusCode = error.statusCode || 500;
  const message = error.isOperational ? error.message : (statusCode === 500 ? 'Internal Server Error' : error.message);

  return sendError(res, {
    statusCode,
    message,
    errors: error.errors || (process.env.NODE_ENV === 'development' && statusCode >= 500 ? [err.stack] : undefined),
  });
};

module.exports = errorHandler;
