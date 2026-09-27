const express = require('express');
const consultationController = require('../controllers/consultationController');
const { authenticateUser, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticateUser);

router
  .route('/')
  .post(
    authorizeRoles('ADMIN', 'DOCTOR'),
    consultationController.createConsultation
  )
  .get(
    authorizeRoles('ADMIN', 'RECEPTIONIST', 'DOCTOR'),
    consultationController.getConsultations
  );

router
  .route('/appointment/:appointmentId')
  .get(
    authorizeRoles('ADMIN', 'RECEPTIONIST', 'DOCTOR'),
    consultationController.getConsultationByAppointmentId
  );

router
  .route('/:id')
  .get(
    authorizeRoles('ADMIN', 'RECEPTIONIST', 'DOCTOR'),
    consultationController.getConsultationById
  )
  .put(
    authorizeRoles('ADMIN', 'DOCTOR'),
    consultationController.updateConsultation
  );

module.exports = router;
