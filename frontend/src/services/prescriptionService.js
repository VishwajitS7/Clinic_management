import api from './api';

export const prescriptionService = {
  getPrescriptions: async (params = {}) => {
    return api.get('/prescriptions', { params });
  },

  getPrescriptionById: async (id) => {
    return api.get(`/prescriptions/${id}`);
  },

  getPrescriptionByConsultationId: async (consultationId) => {
    return api.get(`/prescriptions/consultation/${consultationId}`);
  },

  createPrescription: async (prescriptionData) => {
    return api.post('/prescriptions', prescriptionData);
  },

  updatePrescription: async (id, updateData) => {
    return api.put(`/prescriptions/${id}`, updateData);
  },
};

export default prescriptionService;
