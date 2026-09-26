const express = require('express');
const healthRoutes = require('./healthRoutes');
const authRoutes = require('./authRoutes');
const patientRoutes = require('./patientRoutes');

const router = express.Router();

// Mount Modular Routes
router.use('/', healthRoutes);
router.use('/auth', authRoutes);
router.use('/patients', patientRoutes);
// router.use('/doctors', doctorRoutes);
// router.use('/schedules', scheduleRoutes);
// router.use('/appointments', appointmentRoutes);
// router.use('/consultations', consultationRoutes);
// router.use('/prescriptions', prescriptionRoutes);
// router.use('/invoices', invoiceRoutes);
// router.use('/dashboard', dashboardRoutes);

module.exports = router;
