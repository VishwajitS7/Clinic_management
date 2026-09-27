const path = require('path');
const dotenv = require('dotenv');

// Load environment configuration
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const mongoose = require('mongoose');
const {
  User,
  Doctor,
  Patient,
  DoctorSchedule,
  Appointment,
  Consultation,
  Prescription,
  Invoice,
  Payment,
} = require('../models');
const {
  generatePatientCode,
  generateAppointmentCode,
  generateInvoiceNumber,
  generatePaymentCode,
} = require('../utils/codeGenerators');

const seedDatabase = async () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/clinic_manager';

  console.log(' Connecting to MongoDB for seeding...');
  await mongoose.connect(mongoURI, { autoIndex: true });
  console.log(' Connected to MongoDB database successfully.');

  try {
    console.log(' Clearing existing clinic collections...');
    await Promise.all([
      User.deleteMany({}),
      Doctor.deleteMany({}),
      Patient.deleteMany({}),
      DoctorSchedule.deleteMany({}),
      Appointment.deleteMany({}),
      Consultation.deleteMany({}),
      Prescription.deleteMany({}),
      Invoice.deleteMany({}),
      Payment.deleteMany({}),
    ]);
    console.log(' Existing collections cleared.');

    // ==========================================
    // 1. Seed Users (Admin, Receptionist, Doctors)
    // ==========================================
    console.log(' Seeding User accounts...');
    const adminUser = await User.create({
      name: 'System Administrator',
      email: 'admin@clinic.com',
      password: 'Admin@123',
      phone: '+91 98765 00001',
      role: 'ADMIN',
    });

    const receptionistUser = await User.create({
      name: 'Ritu Verma',
      email: 'receptionist@clinic.com',
      password: 'Recep@123',
      phone: '+91 98765 00002',
      role: 'RECEPTIONIST',
    });

    const doctorUsersData = [
      { name: 'Dr. Rahul Sharma', email: 'dr.rahul@clinic.com', phone: '+91 98765 10001' },
      { name: 'Dr. Priya Patel', email: 'dr.priya@clinic.com', phone: '+91 98765 10002' },
      { name: 'Dr. Arun Kumar', email: 'dr.arun@clinic.com', phone: '+91 98765 10003' },
      { name: 'Dr. Anita Desai', email: 'dr.anita@clinic.com', phone: '+91 98765 10004' },
      { name: 'Dr. Vikram Rao', email: 'dr.vikram@clinic.com', phone: '+91 98765 10005' },
    ];

    const doctorUsers = [];
    for (const doc of doctorUsersData) {
      const u = await User.create({
        name: doc.name,
        email: doc.email,
        password: 'Doctor@123',
        phone: doc.phone,
        role: 'DOCTOR',
      });
      doctorUsers.push(u);
    }
    console.log(` Created ${doctorUsers.length + 2} Users (1 Admin, 1 Receptionist, ${doctorUsers.length} Doctors).`);

    // ==========================================
    // 2. Seed Doctor Profiles (5 Specialties)
    // ==========================================
    console.log(' Seeding Doctor profiles...');
    const doctorsData = [
      {
        user: doctorUsers[0]._id,
        specialization: 'Cardiology',
        qualification: 'MBBS, MD, DM (Cardiology)',
        experienceYears: 14,
        licenseNumber: 'MCI-CARD-2010-001',
        consultationFee: 800,
      },
      {
        user: doctorUsers[1]._id,
        specialization: 'Dermatology',
        qualification: 'MBBS, MD (Dermatology, Venereology & Leprosy)',
        experienceYears: 9,
        licenseNumber: 'MCI-DERM-2015-042',
        consultationFee: 600,
      },
      {
        user: doctorUsers[2]._id,
        specialization: 'Orthopedics',
        qualification: 'MBBS, MS (Orthopedics), M.Ch',
        experienceYears: 16,
        licenseNumber: 'MCI-ORTH-2008-119',
        consultationFee: 900,
      },
      {
        user: doctorUsers[3]._id,
        specialization: 'General Medicine',
        qualification: 'MBBS, MD (Internal Medicine)',
        experienceYears: 11,
        licenseNumber: 'MCI-GENM-2013-288',
        consultationFee: 500,
      },
      {
        user: doctorUsers[4]._id,
        specialization: 'Neurology',
        qualification: 'MBBS, MD, DM (Neurology)',
        experienceYears: 15,
        licenseNumber: 'MCI-NEUR-2009-077',
        consultationFee: 1000,
      },
    ];

    const doctors = await Doctor.insertMany(doctorsData);
    console.log(` Created ${doctors.length} Doctor profiles.`);

    // ==========================================
    // 3. Seed Doctor Schedules
    // ==========================================
    console.log(' Seeding Doctor schedules...');
    const schedulesData = [];
    const weekdays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

    doctors.forEach((doc, idx) => {
      weekdays.forEach((day) => {
        // Morning Slot
        schedulesData.push({
          doctor: doc._id,
          dayOfWeek: day,
          startTime: '09:00',
          endTime: '13:00',
          slotDuration: 30,
          isAvailable: true,
        });

        // Evening Slot (Mon-Fri)
        if (day !== 'SATURDAY' && day !== 'SUNDAY') {
          schedulesData.push({
            doctor: doc._id,
            dayOfWeek: day,
            startTime: '14:30',
            endTime: '18:00',
            slotDuration: 30,
            isAvailable: true,
          });
        }
      });
    });

    const schedules = await DoctorSchedule.insertMany(schedulesData);
    console.log(` Created ${schedules.length} Doctor weekly schedules.`);

    // ==========================================
    // 4. Seed Patients (20 Realistic Profiles)
    // ==========================================
    console.log(' Seeding 20 Patients...');
    const patientSeedData = [
      { name: 'Aarav Sharma', gender: 'MALE', bloodGroup: 'B+', dob: '1988-04-12', phone: '+91 98200 11001', email: 'aarav.sharma@example.com', address: 'Bandra West, Mumbai', notes: 'Mild hypertension' },
      { name: 'Diya Patel', gender: 'FEMALE', bloodGroup: 'O+', dob: '1995-09-23', phone: '+91 98200 11002', email: 'diya.patel@example.com', address: 'Kothrud, Pune', notes: 'Seasonal pollen allergies' },
      { name: 'Rohan Kulkarni', gender: 'MALE', bloodGroup: 'A+', dob: '1976-11-05', phone: '+91 98200 11003', email: 'rohan.k@example.com', address: 'Deccan, Pune', notes: 'Type 2 Diabetes Mellitus' },
      { name: 'Ananya Iyer', gender: 'FEMALE', bloodGroup: 'AB+', dob: '2001-02-18', phone: '+91 98200 11004', email: 'ananya.iyer@example.com', address: 'Indiranagar, Bengaluru', notes: 'Frequent tension headaches' },
      { name: 'Vikramaditya Rao', gender: 'MALE', bloodGroup: 'O-', dob: '1965-07-30', phone: '+91 98200 11005', email: 'vikram.rao@example.com', address: 'Jayanagar, Bengaluru', notes: 'Previous knee arthroscopy' },
      { name: 'Pooja Hegde', gender: 'FEMALE', bloodGroup: 'A-', dob: '1992-12-14', phone: '+91 98200 11006', email: 'pooja.h@example.com', address: 'Whitefield, Bengaluru', notes: 'Atopic dermatitis history' },
      { name: 'Kabir Mehta', gender: 'MALE', bloodGroup: 'B-', dob: '1984-06-25', phone: '+91 98200 11007', email: 'kabir.mehta@example.com', address: 'Andheri East, Mumbai', notes: 'Gastric acidity and reflux' },
      { name: 'Sneha Deshmukh', gender: 'FEMALE', bloodGroup: 'B+', dob: '1998-08-09', phone: '+91 98200 11008', email: 'sneha.d@example.com', address: 'Shivajinagar, Pune', notes: 'Iron deficiency anemia' },
      { name: 'Arjun Nambiar', gender: 'MALE', bloodGroup: 'O+', dob: '1990-03-15', phone: '+91 98200 11009', email: 'arjun.n@example.com', address: 'Panampilly Nagar, Kochi', notes: 'Lumbar disc pain' },
      { name: 'Meera Chawla', gender: 'FEMALE', bloodGroup: 'AB-', dob: '1981-10-28', phone: '+91 98200 11010', email: 'meera.c@example.com', address: 'Connaught Place, New Delhi', notes: 'Migraine with aura' },
      { name: 'Siddharth Joshi', gender: 'MALE', bloodGroup: 'A+', dob: '1994-01-17', phone: '+91 98200 11011', email: 'sid.joshi@example.com', address: 'Model Town, New Delhi', notes: 'Routine checkup' },
      { name: 'Kavita Menon', gender: 'FEMALE', bloodGroup: 'O+', dob: '1970-05-19', phone: '+91 98200 11012', email: 'kavita.m@example.com', address: 'Alwarpet, Chennai', notes: 'Osteoarthritis right knee' },
      { name: 'Nikhil Saxena', gender: 'MALE', bloodGroup: 'B+', dob: '1987-07-22', phone: '+91 98200 11013', email: 'nikhil.s@example.com', address: 'Gomti Nagar, Lucknow', notes: 'High cholesterol levels' },
      { name: 'Tanvi Sengupta', gender: 'FEMALE', bloodGroup: 'A-', dob: '1999-11-03', phone: '+91 98200 11014', email: 'tanvi.s@example.com', address: 'Salt Lake, Kolkata', notes: 'Allergic rhinitis' },
      { name: 'Gaurav Bhatia', gender: 'MALE', bloodGroup: 'AB+', dob: '1983-09-11', phone: '+91 98200 11015', email: 'gaurav.b@example.com', address: 'Sector 17, Chandigarh', notes: 'Lower back stiffness' },
      { name: 'Ishita Bansal', gender: 'FEMALE', bloodGroup: 'O+', dob: '1996-04-06', phone: '+91 98200 11016', email: 'ishita.b@example.com', address: 'Civil Lines, Jaipur', notes: 'Acne vulgaris' },
      { name: 'Pranav Reddy', gender: 'MALE', bloodGroup: 'B-', dob: '1979-12-01', phone: '+91 98200 11017', email: 'pranav.r@example.com', address: 'Banjara Hills, Hyderabad', notes: 'Borderline blood sugar' },
      { name: 'Ritu Singhania', gender: 'FEMALE', bloodGroup: 'A+', dob: '1986-08-16', phone: '+91 98200 11018', email: 'ritu.s@example.com', address: 'Jubilee Hills, Hyderabad', notes: 'Hypothyroidism' },
      { name: 'Manoj Pillai', gender: 'MALE', bloodGroup: 'O-', dob: '1968-03-29', phone: '+91 98200 11019', email: 'manoj.p@example.com', address: 'Thampanoor, Thiruvananthapuram', notes: 'Essential hypertension' },
      { name: 'Sanya Mirza', gender: 'FEMALE', bloodGroup: 'B+', dob: '1993-05-14', phone: '+91 98200 11020', email: 'sanya.m@example.com', address: 'Camp, Pune', notes: 'Post-viral fatigue' },
    ];

    const patients = [];
    for (let i = 0; i < patientSeedData.length; i++) {
      const p = patientSeedData[i];
      const patientDoc = await Patient.create({
        patientCode: generatePatientCode(i + 1),
        name: p.name,
        dateOfBirth: new Date(p.dob),
        gender: p.gender,
        bloodGroup: p.bloodGroup,
        phone: p.phone,
        email: p.email,
        address: p.address,
        emergencyContact: {
          name: `Emergency Contact for ${p.name.split(' ')[0]}`,
          relationship: p.gender === 'MALE' ? 'Spouse' : 'Brother',
          phone: '+91 99999 88888',
        },
        medicalNotes: p.notes,
        isActive: true,
      });
      patients.push(patientDoc);
    }
    console.log(` Created ${patients.length} Patient profiles.`);

    // ==========================================
    // 5. Seed Appointments (Completed, Confirmed, Scheduled, Cancelled)
    // ==========================================
    console.log(' Seeding Appointments across lifecycle states...');
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const dayAfter = new Date(today);
    dayAfter.setDate(today.getDate() + 2);

    const appointmentDefs = [
      // Completed appointments (Yesterday & Today morning)
      { patientIdx: 0, doctorIdx: 0, date: yesterday, startTime: '09:00', endTime: '09:30', status: 'COMPLETED', reason: 'Chest heaviness and palpitations' },
      { patientIdx: 1, doctorIdx: 1, date: yesterday, startTime: '10:00', endTime: '10:30', status: 'COMPLETED', reason: 'Skin rash with intense itching on forearms' },
      { patientIdx: 2, doctorIdx: 2, date: yesterday, startTime: '11:00', endTime: '11:30', status: 'COMPLETED', reason: 'Right knee joint pain after jogging' },
      { patientIdx: 3, doctorIdx: 3, date: yesterday, startTime: '14:30', endTime: '15:00', status: 'COMPLETED', reason: 'Persistent low-grade fever and body ache' },
      { patientIdx: 4, doctorIdx: 4, date: yesterday, startTime: '16:00', endTime: '16:30', status: 'COMPLETED', reason: 'Severe unilateral headache with nausea' },
      { patientIdx: 5, doctorIdx: 0, date: today, startTime: '09:30', endTime: '10:00', status: 'COMPLETED', reason: 'Routine cardiovascular follow-up' },
      { patientIdx: 6, doctorIdx: 1, date: today, startTime: '10:30', endTime: '11:00', status: 'COMPLETED', reason: 'Facial acne assessment' },

      // Confirmed appointments (Today afternoon & Tomorrow)
      { patientIdx: 7, doctorIdx: 2, date: today, startTime: '15:00', endTime: '15:30', status: 'CONFIRMED', reason: 'Follow-up for lumbar spine x-ray' },
      { patientIdx: 8, doctorIdx: 3, date: today, startTime: '16:00', endTime: '16:30', status: 'CONFIRMED', reason: 'Evaluation of routine blood biochemistry' },
      { patientIdx: 9, doctorIdx: 0, date: tomorrow, startTime: '09:00', endTime: '09:30', status: 'CONFIRMED', reason: 'ECG review and blood pressure assessment' },
      { patientIdx: 10, doctorIdx: 1, date: tomorrow, startTime: '10:00', endTime: '10:30', status: 'CONFIRMED', reason: 'Eczema patch treatment follow-up' },
      { patientIdx: 11, doctorIdx: 4, date: tomorrow, startTime: '11:30', endTime: '12:00', status: 'CONFIRMED', reason: 'Dizziness and episodic vertigo' },

      // Scheduled appointments (Upcoming)
      { patientIdx: 12, doctorIdx: 0, date: tomorrow, startTime: '15:00', endTime: '15:30', status: 'SCHEDULED', reason: 'Hypertension consultation' },
      { patientIdx: 13, doctorIdx: 2, date: dayAfter, startTime: '09:30', endTime: '10:00', status: 'SCHEDULED', reason: 'Shoulder tendonitis evaluation' },
      { patientIdx: 14, doctorIdx: 3, date: dayAfter, startTime: '10:30', endTime: '11:00', status: 'SCHEDULED', reason: 'Annual executive health check' },

      // Cancelled appointment
      { patientIdx: 15, doctorIdx: 1, date: yesterday, startTime: '15:30', endTime: '16:00', status: 'CANCELLED', reason: 'Patient requested reschedule due to travel' },
    ];

    const appointments = [];
    for (let i = 0; i < appointmentDefs.length; i++) {
      const def = appointmentDefs[i];
      const apt = await Appointment.create({
        appointmentCode: generateAppointmentCode(i + 1),
        patient: patients[def.patientIdx]._id,
        doctor: doctors[def.doctorIdx]._id,
        appointmentDate: def.date,
        startTime: def.startTime,
        endTime: def.endTime,
        status: def.status,
        reason: def.reason,
        notes: `Appointment recorded by Reception desk.`,
        createdBy: receptionistUser._id,
      });
      appointments.push(apt);
    }
    console.log(` Created ${appointments.length} Appointments.`);

    // ==========================================
    // 6. Seed Consultations for Completed Appointments
    // ==========================================
    console.log(' Seeding Consultations...');
    const completedAppointments = appointments.filter((a) => a.status === 'COMPLETED');
    const consultationsData = [
      {
        symptoms: 'Exertional chest discomfort and occasional palpitations for 3 weeks',
        diagnosis: 'Mild Sinus Tachycardia with Essential Hypertension Stage 1',
        clinicalNotes: 'Resting BP 138/88 mmHg. Pulse 84 bpm. ECG reveals normal sinus rhythm with occasional PACs. Advised low-sodium DASH diet.',
        followUpDays: 14,
      },
      {
        symptoms: 'Pruritic erythematous papules over bilateral flexor forearms',
        diagnosis: 'Contact Dermatitis (probable allergic etiology)',
        clinicalNotes: 'Skin patch test recommended. Emollient barrier cream and mild topical steroid prescribed.',
        followUpDays: 10,
      },
      {
        symptoms: 'Sharp right knee joint pain aggravated by stair climbing',
        diagnosis: 'Right Knee Patellofemoral Pain Syndrome (Mild Chondromalacia)',
        clinicalNotes: 'No joint effusion. McMurray test negative. Prescribed quadriceps strengthening physiotherapy and NSAIDs.',
        followUpDays: 21,
      },
      {
        symptoms: 'Intermittent fever up to 100.8°F, generalized myalgia, chills for 4 days',
        diagnosis: 'Acute Viral Febrile Illness with Pharyngitis',
        clinicalNotes: 'Throat examination reveals mild pharyngeal erythema. Chest clear on auscultation. Hydration and antipyretics advised.',
        followUpDays: 5,
      },
      {
        symptoms: 'Throbbing left hemicranial headache lasting 8-12 hours accompanied by photophobia',
        diagnosis: 'Migraine without Aura',
        clinicalNotes: 'Cranial nerve exam intact. No neurological focal deficits. Prescribed acute triptan therapy and sleep hygiene counseling.',
        followUpDays: 30,
      },
      {
        symptoms: 'Routine cardiovascular surveillance; patient asymptomatic today',
        diagnosis: 'Well-controlled Hypertension',
        clinicalNotes: 'BP 124/80 mmHg. Excellent medication compliance reported. Continue current maintenance dosage.',
        followUpDays: 60,
      },
      {
        symptoms: 'Recurrent inflammatory comedones and papulopustular lesions on cheeks',
        diagnosis: 'Acne Vulgaris Grade 2',
        clinicalNotes: 'Non-comedogenic skincare regimen explained. Initiated topical retinoid and benzoyl peroxide gel.',
        followUpDays: 28,
      },
    ];

    const consultations = [];
    for (let i = 0; i < completedAppointments.length; i++) {
      const apt = completedAppointments[i];
      const cDef = consultationsData[i % consultationsData.length];
      const followUpDate = new Date();
      followUpDate.setDate(followUpDate.getDate() + cDef.followUpDays);

      const consult = await Consultation.create({
        appointment: apt._id,
        doctor: apt.doctor,
        patient: apt.patient,
        symptoms: cDef.symptoms,
        diagnosis: cDef.diagnosis,
        clinicalNotes: cDef.clinicalNotes,
        followUpDate,
      });
      consultations.push(consult);
    }
    console.log(` Created ${consultations.length} Consultations.`);

    // ==========================================
    // 7. Seed Prescriptions (Demonstrates Embedded Subdocuments)
    // ==========================================
    console.log(' Seeding Prescriptions with embedded medicines...');
    const prescriptionMedicines = [
      [
        { medicineName: 'Telmisartan', dosage: '40 mg', frequency: 'Once daily (morning)', duration: '30 days', route: 'Oral', instructions: 'Take after breakfast' },
        { medicineName: 'Metoprolol Succinate', dosage: '25 mg', frequency: 'Once daily', duration: '30 days', route: 'Oral', instructions: 'Take with water' },
      ],
      [
        { medicineName: 'Desloratadine', dosage: '5 mg', frequency: 'Once daily (night)', duration: '10 days', route: 'Oral', instructions: 'Take before sleep' },
        { medicineName: 'Mometasone Furoate 0.1% Cream', dosage: 'Thin film', frequency: 'Twice daily', duration: '10 days', route: 'Topical', instructions: 'Apply locally to affected forearm areas' },
      ],
      [
        { medicineName: 'Aceclofenac + Paracetamol', dosage: '100 mg / 325 mg', frequency: 'Twice daily', duration: '5 days', route: 'Oral', instructions: 'Strictly after meals' },
        { medicineName: 'Pantoprazole', dosage: '40 mg', frequency: 'Once daily', duration: '5 days', route: 'Oral', instructions: 'Take on empty stomach 30 mins before breakfast' },
      ],
      [
        { medicineName: 'Paracetamol', dosage: '650 mg', frequency: 'Thrice daily', duration: '4 days', route: 'Oral', instructions: 'Take SOS for temperature above 99.5°F' },
        { medicineName: 'Vitamin C + Zinc Chewable', dosage: '500 mg', frequency: 'Once daily', duration: '15 days', route: 'Oral', instructions: 'Chew after food' },
      ],
      [
        { medicineName: 'Zolmitriptan', dosage: '2.5 mg', frequency: 'SOS at headache onset', duration: '6 tablets', route: 'Oral', instructions: 'Max 2 tablets in 24 hours' },
        { medicineName: 'Naproxen Sodium', dosage: '500 mg', frequency: 'SOS with triptan', duration: '6 tablets', route: 'Oral', instructions: 'Take with food or antacid' },
      ],
      [
        { medicineName: 'Amlodipine', dosage: '5 mg', frequency: 'Once daily', duration: '60 days', route: 'Oral', instructions: 'Morning dose' },
      ],
      [
        { medicineName: 'Clindamycin 1% + Nicotinamide 4% Gel', dosage: 'Pea-sized amount', frequency: 'Twice daily', duration: '30 days', route: 'Topical', instructions: 'Apply on clean dry skin' },
        { medicineName: 'Adapalene 0.1% Gel', dosage: 'Thin layer', frequency: 'Once at bedtime', duration: '30 days', route: 'Topical', instructions: 'Avoid direct sunlight exposure' },
      ],
    ];

    const prescriptions = [];
    for (let i = 0; i < consultations.length; i++) {
      const consult = consultations[i];
      const items = prescriptionMedicines[i % prescriptionMedicines.length];

      const presc = await Prescription.create({
        consultation: consult._id,
        doctor: consult.doctor,
        patient: consult.patient,
        prescriptionDate: new Date(),
        items,
        instructions: 'Follow prescribed dosages carefully. Contact clinic if any adverse reaction occurs.',
      });
      prescriptions.push(presc);
    }
    console.log(` Created ${prescriptions.length} Prescriptions.`);

    // ==========================================
    // 8. Seed Invoices & Payments (Demonstrating Financial Engine)
    // ==========================================
    console.log(' Seeding Invoices with embedded items & backend calculations...');
    const invoiceConfigurations = [
      // 1. Paid Invoice (Card)
      { aptIdx: 0, items: [{ description: 'Cardiology Specialist Consultation', quantity: 1, unitPrice: 800 }, { description: '12-Lead Electrocardiogram (ECG)', quantity: 1, unitPrice: 400 }], discount: 100, tax: 0, payments: [{ amount: 1100, method: 'CARD' }] },
      // 2. Paid Invoice (UPI)
      { aptIdx: 1, items: [{ description: 'Dermatology Consultation', quantity: 1, unitPrice: 600 }, { description: 'Skin Lesion Dermoscopy', quantity: 1, unitPrice: 500 }], discount: 0, tax: 0, payments: [{ amount: 1100, method: 'UPI' }] },
      // 3. Partially Paid Invoice (Cash)
      { aptIdx: 2, items: [{ description: 'Orthopedic Consultation', quantity: 1, unitPrice: 900 }, { description: 'Digital X-Ray Knee AP & Lateral', quantity: 1, unitPrice: 700 }], discount: 100, tax: 0, payments: [{ amount: 1000, method: 'CASH' }] },
      // 4. Paid Invoice (Cash)
      { aptIdx: 3, items: [{ description: 'General Medicine Consultation', quantity: 1, unitPrice: 500 }, { description: 'Complete Blood Count (CBC)', quantity: 1, unitPrice: 350 }], discount: 50, tax: 0, payments: [{ amount: 800, method: 'CASH' }] },
      // 5. Unpaid Invoice
      { aptIdx: 4, items: [{ description: 'Neurology Consultation', quantity: 1, unitPrice: 1000 }], discount: 0, tax: 0, payments: [] },
      // 6. Paid Invoice (Online)
      { aptIdx: 5, items: [{ description: 'Cardiology Follow-up Consultation', quantity: 1, unitPrice: 500 }], discount: 0, tax: 0, payments: [{ amount: 500, method: 'ONLINE' }] },
      // 7. Partially Paid Invoice (UPI)
      { aptIdx: 6, items: [{ description: 'Dermatology Procedure & Consultation', quantity: 1, unitPrice: 1200 }], discount: 200, tax: 0, payments: [{ amount: 500, method: 'UPI' }] },
    ];

    let invoiceCount = 0;
    let paymentCount = 0;

    for (const conf of invoiceConfigurations) {
      invoiceCount++;
      const apt = appointments[conf.aptIdx];

      // Formulate items with amounts
      const itemsWithAmounts = conf.items.map((it) => ({
        ...it,
        amount: it.quantity * it.unitPrice,
      }));

      const subtotal = itemsWithAmounts.reduce((acc, it) => acc + it.amount, 0);
      const totalAmount = Math.max(0, subtotal - conf.discount + conf.tax);
      const totalPaid = conf.payments.reduce((acc, p) => acc + p.amount, 0);
      const amountDue = Math.max(0, totalAmount - totalPaid);

      let status = 'UNPAID';
      if (totalPaid >= totalAmount) status = 'PAID';
      else if (totalPaid > 0) status = 'PARTIALLY_PAID';

      const invoice = await Invoice.create({
        invoiceNumber: generateInvoiceNumber(invoiceCount),
        patient: apt.patient,
        appointment: apt._id,
        items: itemsWithAmounts,
        subtotal,
        discount: conf.discount,
        tax: conf.tax,
        totalAmount,
        amountPaid: totalPaid,
        amountDue,
        status,
        issuedAt: new Date(),
      });

      // Record payments
      for (const p of conf.payments) {
        paymentCount++;
        await Payment.create({
          paymentCode: generatePaymentCode(paymentCount),
          invoice: invoice._id,
          amount: p.amount,
          paymentMethod: p.method,
          transactionReference: `TXN-${p.method}-${Date.now().toString().slice(-6)}`,
          paidAt: new Date(),
          createdBy: receptionistUser._id,
          notes: `Payment received at reception desk.`,
        });
      }
    }
    console.log(` Created ${invoiceCount} Invoices and ${paymentCount} Payments.`);

    console.log('=====================================================');
    console.log(' SEEDING COMPLETED SUCCESSFULLY!');
    console.log(' Demo Accounts:');
    console.log('   Admin:        admin@clinic.com        / Admin@123');
    console.log('   Doctor:       dr.rahul@clinic.com     / Doctor@123');
    console.log('   Receptionist: receptionist@clinic.com / Recep@123');
    console.log('=====================================================');
  } catch (error) {
    console.error(' [Seeding Error]:', error);
  } finally {
    await mongoose.disconnect();
    console.log(' MongoDB disconnected after seeding.');
  }
};

seedDatabase();
