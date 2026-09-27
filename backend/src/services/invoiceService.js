const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const AppError = require('../utils/AppError');
const { generateInvoiceNumber, generatePaymentCode } = require('../utils/codeGenerators');

/**
 * Creates an invoice with backend financial calculation
 */
const createInvoice = async (data) => {
  const { patientId, appointmentId, items, discount = 0, tax = 0 } = data;

  // 1. Verify patient
  const patient = await Patient.findById(patientId);
  if (!patient) {
    throw new AppError('Patient not found', 404);
  }

  // 2. Verify appointment
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) {
    throw new AppError('Appointment not found', 404);
  }

  // 3. Compute item amounts & subtotal
  const formattedItems = items.map((item) => {
    const qty = Number(item.quantity) || 1;
    const price = Number(item.unitPrice) || 0;
    return {
      description: item.description.trim(),
      quantity: qty,
      unitPrice: price,
      amount: Number((qty * price).toFixed(2)),
    };
  });

  const calculatedSubtotal = Number(
    formattedItems.reduce((acc, curr) => acc + curr.amount, 0).toFixed(2)
  );

  const numDiscount = Number(discount) || 0;
  const numTax = Number(tax) || 0;

  if (numDiscount > calculatedSubtotal) {
    throw new AppError('Discount cannot exceed subtotal amount', 400);
  }

  const calculatedTotal = Number(
    Math.max(0, calculatedSubtotal - numDiscount + numTax).toFixed(2)
  );

  // 4. Generate sequential invoice number
  const count = await Invoice.countDocuments();
  const year = new Date().getFullYear();
  const invoiceNumber = generateInvoiceNumber(count + 1, year);

  // 5. Create invoice
  const invoice = await Invoice.create({
    invoiceNumber,
    patient: patientId,
    appointment: appointmentId,
    items: formattedItems,
    subtotal: calculatedSubtotal,
    discount: numDiscount,
    tax: numTax,
    totalAmount: calculatedTotal,
    amountPaid: 0,
    amountDue: calculatedTotal,
    status: 'UNPAID',
    issuedAt: new Date(),
  });

  return await getInvoiceById(invoice._id);
};

/**
 * Gets paginated invoices
 */
const getInvoices = async (queryParams) => {
  const {
    page = 1,
    limit = 10,
    search,
    status,
    patientId,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = queryParams;

  const query = {};

  if (status) {
    query.status = status;
  }

  if (patientId) {
    query.patient = patientId;
  }

  if (search) {
    query.$or = [
      { invoiceNumber: { $regex: search, $options: 'i' } },
      { 'items.description': { $regex: search, $options: 'i' } },
    ];
  }

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;
  const sortDirection = sortOrder === 'asc' ? 1 : -1;

  const [invoices, total] = await Promise.all([
    Invoice.find(query)
      .populate('patient', 'patientCode name firstName lastName phone email')
      .populate({
        path: 'appointment',
        select: 'appointmentCode appointmentDate doctor status',
        populate: {
          path: 'doctor',
          select: 'specialization consultationFee',
          populate: { path: 'user', select: 'name' },
        },
      })
      .sort({ [sortBy]: sortDirection })
      .skip(skip)
      .limit(limitNum),
    Invoice.countDocuments(query),
  ]);

  return {
    invoices,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  };
};

/**
 * Gets invoice by ID with linked payment transactions
 */
const getInvoiceById = async (id) => {
  const invoice = await Invoice.findById(id)
    .populate('patient')
    .populate({
      path: 'appointment',
      populate: {
        path: 'doctor',
        populate: { path: 'user', select: 'name email phone' },
      },
    });

  if (!invoice) {
    throw new AppError('Invoice not found', 404);
  }

  // Fetch all payment receipts for this invoice
  const payments = await Payment.find({ invoice: invoice._id })
    .populate('createdBy', 'name email role')
    .sort({ paidAt: -1 });

  const invoiceObj = invoice.toObject();
  invoiceObj.payments = payments;

  return invoiceObj;
};

/**
 * Records a payment against an invoice (Prevents overpayment)
 */
const recordPayment = async (invoiceId, paymentData, userId) => {
  const { amount, paymentMethod, transactionReference, notes } = paymentData;

  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) {
    throw new AppError('Invoice not found', 404);
  }

  if (invoice.status === 'PAID') {
    throw new AppError('Invoice is already fully paid', 400);
  }

  if (invoice.status === 'CANCELLED') {
    throw new AppError('Cannot record payment for a cancelled invoice', 400);
  }

  const paymentAmount = Number(Number(amount).toFixed(2));

  // Overpayment prevention rule
  if (paymentAmount > invoice.amountDue) {
    throw new AppError(
      `Payment amount ₹${paymentAmount} exceeds the remaining balance due of ₹${invoice.amountDue}`,
      400
    );
  }

  // Generate sequential payment code
  const count = await Payment.countDocuments();
  const year = new Date().getFullYear();
  const paymentCode = generatePaymentCode(count + 1, year);

  // Create payment record
  const payment = await Payment.create({
    paymentCode,
    invoice: invoice._id,
    amount: paymentAmount,
    paymentMethod,
    transactionReference,
    notes,
    createdBy: userId,
  });

  // Update invoice financials
  invoice.amountPaid = Number((invoice.amountPaid + paymentAmount).toFixed(2));
  invoice.amountDue = Number(Math.max(0, invoice.totalAmount - invoice.amountPaid).toFixed(2));

  if (invoice.amountDue === 0) {
    invoice.status = 'PAID';
  } else {
    invoice.status = 'PARTIALLY_PAID';
  }

  await invoice.save();

  return {
    payment,
    invoice: await getInvoiceById(invoice._id),
  };
};

/**
 * Gets payments list
 */
const getPayments = async (queryParams) => {
  const { page = 1, limit = 10, invoiceId } = queryParams;

  const query = {};
  if (invoiceId) {
    query.invoice = invoiceId;
  }

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const [payments, total] = await Promise.all([
    Payment.find(query)
      .populate({
        path: 'invoice',
        select: 'invoiceNumber totalAmount amountPaid amountDue status patient',
        populate: { path: 'patient', select: 'name firstName lastName patientCode' },
      })
      .populate('createdBy', 'name email role')
      .sort({ paidAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Payment.countDocuments(query),
  ]);

  return {
    payments,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  };
};

module.exports = {
  createInvoice,
  getInvoices,
  getInvoiceById,
  recordPayment,
  getPayments,
};
