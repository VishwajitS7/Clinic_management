const express = require('express');
const appointmentController = require('../controllers/appointmentController');
const { authenticateUser, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

// All appointment routes require authentication
router.use(authenticateUser);

router
  .route('/')
  .post(
    authorizeRoles('ADMIN', 'RECEPTIONIST', 'DOCTOR'),
    appointmentController.createAppointment
  )
  .get(
    authorizeRoles('ADMIN', 'RECEPTIONIST', 'DOCTOR'),
    appointmentController.getAppointments
  );

router
  .route('/:id')
  .get(
    authorizeRoles('ADMIN', 'RECEPTIONIST', 'DOCTOR'),
    appointmentController.getAppointmentById
  )
  .delete(
    authorizeRoles('ADMIN', 'RECEPTIONIST'),
    appointmentController.cancelAppointment
  );

router
  .route('/:id/status')
  .patch(
    authorizeRoles('ADMIN', 'RECEPTIONIST', 'DOCTOR'),
    appointmentController.updateAppointmentStatus
  );

router
  .route('/:id/reschedule')
  .put(
    authorizeRoles('ADMIN', 'RECEPTIONIST', 'DOCTOR'),
    appointmentController.rescheduleAppointment
  );

module.exports = router;
