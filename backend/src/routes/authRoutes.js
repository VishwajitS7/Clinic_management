const express = require('express');
const { login, getMe, logout } = require('../controllers/authController');
const { validateLoginInput } = require('../validators/authValidators');
const { authenticateUser } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/login', validateLoginInput, login);
router.get('/me', authenticateUser, getMe);
router.post('/logout', logout);

module.exports = router;
