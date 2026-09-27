import api from './api';

export const consultationService = {
  getConsultations: async (params = {}) => {
    return api.get('/consultations', { params });
  },

  getConsultationById: async (id) => {
    return api.get(`/consultations/${id}`);
  },

  getConsultationByAppointmentId: async (appointmentId) => {
    return api.get(`/consultations/appointment/${appointmentId}`);
  },

  createConsultation: async (consultationData) => {
    return api.post('/consultations', consultationData);
  },

  updateConsultation: async (id, updateData) => {
    return api.put(`/consultations/${id}`, updateData);
  },
};

export default consultationService;
