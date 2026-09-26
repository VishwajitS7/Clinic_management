const express = require('express');
const healthRoutes = require('./healthRoutes');

const router = express.Router();

// Mount Health Check
router.use('/', healthRoutes);

// Modular routes for subsequent phases will be mounted here:
// router.use('/auth', authRoutes);
// router.use('/patients', patientRoutes);
// router.use('/doctors', doctorRoutes);
// router.use('/schedules', scheduleRoutes);
// router.use('/appointments', appointmentRoutes);
// router.use('/consultations', consultationRoutes);
// router.use('/prescriptions', prescriptionRoutes);
// router.use('/invoices', invoiceRoutes);
// router.use('/dashboard', dashboardRoutes);

module.exports = router;
