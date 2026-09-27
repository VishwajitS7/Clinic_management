const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Consultation = require('../models/Consultation');
const Prescription = require('../models/Prescription');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');

/**
 * Computes dashboard analytics tailored to the requesting user's role
 */
const getDashboardStats = async (currentUser) => {
  const today = new Date();
  const startOfDay = new Date(today);
  startOfDay.setUTCHours(0, 0, 0, 0);
  const endOfDay = new Date(today);
  endOfDay.setUTCHours(23, 59, 59, 999);

  // If Doctor is logged in, provide doctor-specific clinical intelligence
  if (currentUser.role === 'DOCTOR') {
    const doctorProfile = await Doctor.findOne({ user: currentUser._id });
    if (!doctorProfile) {
      return { role: 'DOCTOR', message: 'Doctor profile not found' };
    }

    const doctorId = doctorProfile._id;

    const [
      todayAppointmentsCount,
      totalDoctorAppointments,
      completedConsultationsCount,
      prescriptionsCount,
      upcomingAppointments,
      recentConsultations,
    ] = await Promise.all([
      Appointment.countDocuments({
        doctor: doctorId,
        appointmentDate: { $gte: startOfDay, $lte: endOfDay },
        status: { $nin: ['CANCELLED'] },
      }),
      Appointment.countDocuments({ doctor: doctorId }),
      Consultation.countDocuments({ doctor: doctorId }),
      Prescription.countDocuments({ doctor: doctorId }),
      Appointment.find({
        doctor: doctorId,
        appointmentDate: { $gte: startOfDay },
        status: { $in: ['SCHEDULED', 'CONFIRMED'] },
      })
        .populate('patient', 'firstName lastName patientCode phone bloodGroup')
        .sort({ appointmentDate: 1, startTime: 1 })
        .limit(5),
      Consultation.find({ doctor: doctorId })
        .populate('patient', 'firstName lastName patientCode')
        .populate('appointment', 'appointmentCode')
        .sort({ createdAt: -1 })
        .limit(5),
    ]);

    // Status breakdown for this doctor
    const statusAgg = await Appointment.aggregate([
      { $match: { doctor: doctorId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const statusBreakdown = {};
    statusAgg.forEach((item) => {
      statusBreakdown[item._id] = item.count;
    });

    return {
      role: 'DOCTOR',
      doctor: {
        name: currentUser.name,
        specialization: doctorProfile.specialization,
        consultationFee: doctorProfile.consultationFee,
      },
      metrics: {
        todayAppointments: todayAppointmentsCount,
        totalAppointments: totalDoctorAppointments,
        completedConsultations: completedConsultationsCount,
        prescriptionsIssued: prescriptionsCount,
      },
      statusBreakdown,
      upcomingAppointments,
      recentConsultations,
    };
  }

  // Admin & Receptionist Dashboard
  const [
    totalPatients,
    totalDoctors,
    todayAppointmentsCount,
    totalAppointmentsCount,
    totalConsultations,
    financialStats,
    recentAppointments,
    recentInvoices,
    recentPayments,
  ] = await Promise.all([
    Patient.countDocuments({ isActive: true }),
    Doctor.countDocuments({ isActive: true }),
    Appointment.countDocuments({
      appointmentDate: { $gte: startOfDay, $lte: endOfDay },
    }),
    Appointment.countDocuments(),
    Consultation.countDocuments(),
    Invoice.aggregate([
      {
        $group: {
          _id: null,
          totalBilled: { $sum: '$totalAmount' },
          totalRevenue: { $sum: '$amountPaid' },
          totalDue: { $sum: '$amountDue' },
        },
      },
    ]),
    Appointment.find()
      .populate('patient', 'firstName lastName patientCode phone')
      .populate({
        path: 'doctor',
        populate: { path: 'user', select: 'name' },
      })
      .sort({ createdAt: -1 })
      .limit(6),
    Invoice.find()
      .populate('patient', 'firstName lastName patientCode')
      .sort({ createdAt: -1 })
      .limit(5),
    Payment.find()
      .populate('invoice', 'invoiceNumber')
      .populate('createdBy', 'name')
      .sort({ paidAt: -1 })
      .limit(5),
  ]);

  // Status breakdown for all appointments
  const statusAgg = await Appointment.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const statusBreakdown = {
    SCHEDULED: 0,
    CONFIRMED: 0,
    COMPLETED: 0,
    CANCELLED: 0,
    NO_SHOW: 0,
  };
  statusAgg.forEach((item) => {
    statusBreakdown[item._id] = item.count;
  });

  const financials = financialStats[0] || {
    totalBilled: 0,
    totalRevenue: 0,
    totalDue: 0,
  };

  return {
    role: currentUser.role,
    metrics: {
      totalPatients,
      totalDoctors,
      todayAppointments: todayAppointmentsCount,
      totalAppointments: totalAppointmentsCount,
      totalConsultations,
      totalRevenue: Number(financials.totalRevenue.toFixed(2)),
      totalOutstandingDue: Number(financials.totalDue.toFixed(2)),
      totalBilled: Number(financials.totalBilled.toFixed(2)),
    },
    statusBreakdown,
    recentAppointments,
    recentInvoices,
    recentPayments,
  };
};

module.exports = {
  getDashboardStats,
};
