import api from './api';

export const prescriptionService = {
  getPrescriptions: async (params = {}) => {
    const response = await api.get('/prescriptions', { params });
    return response.data;
  },

  getPrescriptionById: async (id) => {
    const response = await api.get(`/prescriptions/${id}`);
    return response.data;
  },

  getPrescriptionByConsultationId: async (consultationId) => {
    const response = await api.get(`/prescriptions/consultation/${consultationId}`);
    return response.data;
  },

  createPrescription: async (prescriptionData) => {
    const response = await api.post('/prescriptions', prescriptionData);
    return response.data;
  },

  updatePrescription: async (id, updateData) => {
    const response = await api.put(`/prescriptions/${id}`, updateData);
    return response.data;
  },
};

export default prescriptionService;
