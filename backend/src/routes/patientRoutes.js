const express = require('express');
const {
  getPatients,
  getPatient,
  createPatient,
  updatePatient,
  updatePatientStatus,
} = require('../controllers/patientController');
const { authenticateUser, authorizeRoles } = require('../middleware/authMiddleware');
const { validatePatientInput } = require('../validators/patientValidators');

const router = express.Router();

// All patient routes require authentication
router.use(authenticateUser);

router
  .route('/')
  .get(getPatients)
  .post(authorizeRoles('ADMIN', 'RECEPTIONIST'), validatePatientInput, createPatient);

router
  .route('/:id')
  .get(getPatient)
  .put(authorizeRoles('ADMIN', 'RECEPTIONIST'), validatePatientInput, updatePatient);

router
  .route('/:id/status')
  .patch(authorizeRoles('ADMIN'), updatePatientStatus);

module.exports = router;
