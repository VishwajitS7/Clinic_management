const AppError = require('../utils/AppError');

const notFoundHandler = (req, res, next) => {
  next(new AppError(`Cannot find endpoint ${req.method} ${req.originalUrl} on this server`, 404));
};

module.exports = notFoundHandler;
