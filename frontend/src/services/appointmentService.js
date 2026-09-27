import api from './api';

export const appointmentService = {
  getAppointments: async (params = {}) => {
    return api.get('/appointments', { params });
  },

  getAppointmentById: async (id) => {
    return api.get(`/appointments/${id}`);
  },

  createAppointment: async (appointmentData) => {
    return api.post('/appointments', appointmentData);
  },

  updateAppointmentStatus: async (id, status, notes = '') => {
    return api.patch(`/appointments/${id}/status`, { status, notes });
  },

  rescheduleAppointment: async (id, rescheduleData) => {
    return api.put(`/appointments/${id}/reschedule`, rescheduleData);
  },

  cancelAppointment: async (id, reason = '') => {
    return api.delete(`/appointments/${id}`, { data: { reason } });
  },
};

export default appointmentService;
