import api from './api';

export const invoiceService = {
  getInvoices: async (params = {}) => {
    const response = await api.get('/invoices', { params });
    return response.data;
  },

  getInvoiceById: async (id) => {
    const response = await api.get(`/invoices/${id}`);
    return response.data;
  },

  createInvoice: async (invoiceData) => {
    const response = await api.post('/invoices', invoiceData);
    return response.data;
  },

  recordPayment: async (invoiceId, paymentData) => {
    const response = await api.post(`/invoices/${invoiceId}/payments`, paymentData);
    return response.data;
  },

  getPayments: async (params = {}) => {
    const response = await api.get('/invoices/payments', { params });
    return response.data;
  },
};

export default invoiceService;
