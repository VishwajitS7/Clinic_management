import api from './api';

export const consultationService = {
  getConsultations: async (params = {}) => {
    const response = await api.get('/consultations', { params });
    return response.data;
  },

  getConsultationById: async (id) => {
    const response = await api.get(`/consultations/${id}`);
    return response.data;
  },

  getConsultationByAppointmentId: async (appointmentId) => {
    const response = await api.get(`/consultations/appointment/${appointmentId}`);
    return response.data;
  },

  createConsultation: async (consultationData) => {
    const response = await api.post('/consultations', consultationData);
    return response.data;
  },

  updateConsultation: async (id, updateData) => {
    const response = await api.put(`/consultations/${id}`, updateData);
    return response.data;
  },
};

export default consultationService;
