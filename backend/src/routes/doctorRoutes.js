const express = require('express');
const {
  getDoctors,
  getDoctor,
  createDoctor,
  updateDoctor,
  updateDoctorStatus,
  getSpecializations,
} = require('../controllers/doctorController');
const { authenticateUser, authorizeRoles } = require('../middleware/authMiddleware');
const { validateDoctorInput } = require('../validators/doctorValidators');

const router = express.Router();

// All doctor endpoints require authentication
router.use(authenticateUser);

router.get('/specializations', getSpecializations);

router
  .route('/')
  .get(getDoctors)
  .post(authorizeRoles('ADMIN'), validateDoctorInput, createDoctor);

router
  .route('/:id')
  .get(getDoctor)
  .put(authorizeRoles('ADMIN', 'DOCTOR'), validateDoctorInput, updateDoctor);

router
  .route('/:id/status')
  .patch(authorizeRoles('ADMIN'), updateDoctorStatus);

module.exports = router;
