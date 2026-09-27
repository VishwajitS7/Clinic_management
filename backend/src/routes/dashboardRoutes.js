const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const { authenticateUser } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticateUser);

router.get('/stats', dashboardController.getDashboardStats);

module.exports = router;
