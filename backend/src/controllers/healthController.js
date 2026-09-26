const { isDbConnected } = require('../config/database');
const { sendSuccess } = require('../utils/apiResponse');

const getHealthStatus = (req, res) => {
  const healthData = {
    service: 'Clinic Appointment Manager API',
    status: 'UP',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    database: {
      connected: isDbConnected(),
      state: isDbConnected() ? 'CONNECTED' : 'DISCONNECTED',
    },
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
  };

  return sendSuccess(res, {
    statusCode: 200,
    message: 'Clinic Appointment Manager API is running smoothly',
    data: healthData,
  });
};

module.exports = {
  getHealthStatus,
};
