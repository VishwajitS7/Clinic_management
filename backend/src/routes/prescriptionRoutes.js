const express = require('express');
const prescriptionController = require('../controllers/prescriptionController');
const { authenticateUser, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticateUser);

router
  .route('/')
  .post(
    authorizeRoles('ADMIN', 'DOCTOR'),
    prescriptionController.createPrescription
  )
  .get(
    authorizeRoles('ADMIN', 'RECEPTIONIST', 'DOCTOR'),
    prescriptionController.getPrescriptions
  );

router
  .route('/consultation/:consultationId')
  .get(
    authorizeRoles('ADMIN', 'RECEPTIONIST', 'DOCTOR'),
    prescriptionController.getPrescriptionByConsultationId
  );

router
  .route('/:id')
  .get(
    authorizeRoles('ADMIN', 'RECEPTIONIST', 'DOCTOR'),
    prescriptionController.getPrescriptionById
  )
  .put(
    authorizeRoles('ADMIN', 'DOCTOR'),
    prescriptionController.updatePrescription
  );

module.exports = router;
