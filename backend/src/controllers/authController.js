const authService = require('../services/authService');
const { sendSuccess } = require('../utils/apiResponse');

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.loginUser({ email, password });

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Logged in successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const result = await authService.getCurrentUser(req.user._id);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Profile retrieved successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const register = async (req, res, next) => {
  try {
    const result = await authService.registerUser(req.body);

    return sendSuccess(res, {
      statusCode: 201,
      message: 'Registration successful. Account created.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  return sendSuccess(res, {
    statusCode: 200,
    message: 'Logged out successfully',
  });
};

module.exports = {
  login,
  register,
  getMe,
  logout,
};
