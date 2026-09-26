const express = require('express');
const {
  getDoctors,
  getDoctor,
  createDoctor,
  updateDoctor,
  updateDoctorStatus,
  getSpecializations,
} = require('../controllers/doctorController');
const {
  getDoctorSchedules,
  createSchedule,
  getAvailableSlots,
} = require('../controllers/scheduleController');
const { authenticateUser, authorizeRoles } = require('../middleware/authMiddleware');
const { validateDoctorInput } = require('../validators/doctorValidators');
const {
  validateScheduleInput,
  validateAvailableSlotsQuery,
} = require('../validators/scheduleValidators');

const router = express.Router();

// All doctor endpoints require authentication
router.use(authenticateUser);

router.get('/specializations', getSpecializations);

// Section 15: Available Slots API
router.get('/:doctorId/available-slots', validateAvailableSlotsQuery, getAvailableSlots);

// Schedules sub-routes
router
  .route('/:doctorId/schedules')
  .get(getDoctorSchedules)
  .post(authorizeRoles('ADMIN', 'DOCTOR'), validateScheduleInput, createSchedule);

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
