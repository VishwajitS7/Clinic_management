import api from './api';

export const invoiceService = {
  getInvoices: async (params = {}) => {
    return api.get('/invoices', { params });
  },

  getInvoiceById: async (id) => {
    return api.get(`/invoices/${id}`);
  },

  createInvoice: async (invoiceData) => {
    return api.post('/invoices', invoiceData);
  },

  recordPayment: async (invoiceId, paymentData) => {
    return api.post(`/invoices/${invoiceId}/payments`, paymentData);
  },

  getPayments: async (params = {}) => {
    return api.get('/invoices/payments', { params });
  },
};

export default invoiceService;
