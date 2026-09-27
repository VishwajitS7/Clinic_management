const express = require('express');
const invoiceController = require('../controllers/invoiceController');
const { authenticateUser, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticateUser);

router
  .route('/')
  .post(
    authorizeRoles('ADMIN', 'RECEPTIONIST'),
    invoiceController.createInvoice
  )
  .get(
    authorizeRoles('ADMIN', 'RECEPTIONIST', 'DOCTOR'),
    invoiceController.getInvoices
  );

router
  .route('/payments')
  .get(
    authorizeRoles('ADMIN', 'RECEPTIONIST'),
    invoiceController.getPayments
  );

router
  .route('/:id')
  .get(
    authorizeRoles('ADMIN', 'RECEPTIONIST', 'DOCTOR'),
    invoiceController.getInvoiceById
  );

router
  .route('/:id/payments')
  .post(
    authorizeRoles('ADMIN', 'RECEPTIONIST'),
    invoiceController.recordPayment
  );

module.exports = router;
