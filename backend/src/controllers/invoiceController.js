const invoiceService = require('../services/invoiceService');
const {
  validateCreateInvoice,
  validateRecordPayment,
} = require('../validators/invoiceValidators');
const { sendSuccess } = require('../utils/apiResponse');

/**
 * Create new invoice
 */
const createInvoice = async (req, res, next) => {
  try {
    validateCreateInvoice(req.body);
    const invoice = await invoiceService.createInvoice(req.body);
    return sendSuccess(res, {
      statusCode: 201,
      message: 'Invoice generated successfully',
      data: invoice,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all invoices with filters
 */
const getInvoices = async (req, res, next) => {
  try {
    const result = await invoiceService.getInvoices(req.query);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Invoices retrieved successfully',
      data: result.invoices,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get invoice by ID
 */
const getInvoiceById = async (req, res, next) => {
  try {
    const invoice = await invoiceService.getInvoiceById(req.params.id);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Invoice details retrieved successfully',
      data: invoice,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Record a payment against an invoice
 */
const recordPayment = async (req, res, next) => {
  try {
    validateRecordPayment(req.body);
    const result = await invoiceService.recordPayment(
      req.params.id,
      req.body,
      req.user._id
    );
    return sendSuccess(res, {
      statusCode: 201,
      message: 'Payment recorded successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all payments
 */
const getPayments = async (req, res, next) => {
  try {
    const result = await invoiceService.getPayments(req.query);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Payments retrieved successfully',
      data: result.payments,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createInvoice,
  getInvoices,
  getInvoiceById,
  recordPayment,
  getPayments,
};
