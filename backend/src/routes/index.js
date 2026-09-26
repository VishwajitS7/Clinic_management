const express = require('express');
const healthRoutes = require('./healthRoutes');
const authRoutes = require('./authRoutes');

const router = express.Router();

// Mount Health Check & Auth
router.use('/', healthRoutes);
router.use('/auth', authRoutes);
// router.use('/patients', patientRoutes);
// router.use('/doctors', doctorRoutes);
// router.use('/schedules', scheduleRoutes);
// router.use('/appointments', appointmentRoutes);
// router.use('/consultations', consultationRoutes);
// router.use('/prescriptions', prescriptionRoutes);
// router.use('/invoices', invoiceRoutes);
// router.use('/dashboard', dashboardRoutes);

module.exports = router;
