const dashboardService = require('../services/dashboardService');
const { sendSuccess } = require('../utils/apiResponse');

/**
 * Get dashboard statistics for current user
 */
const getDashboardStats = async (req, res, next) => {
  try {
    const stats = await dashboardService.getDashboardStats(req.user);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Dashboard statistics retrieved successfully',
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
};
