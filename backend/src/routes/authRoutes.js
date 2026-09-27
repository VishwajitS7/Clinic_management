const express = require('express');
const { login, register, getMe, logout } = require('../controllers/authController');
const { validateLoginInput, validateRegisterInput } = require('../validators/authValidators');
const { authenticateUser } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/login', validateLoginInput, login);
router.post('/register', validateRegisterInput, register);
router.get('/me', authenticateUser, getMe);
router.post('/logout', logout);

module.exports = router;
