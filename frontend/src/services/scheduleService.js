import api from './api';

export const getDoctorSchedules = async (doctorId) => {
  return api.get(`/doctors/${doctorId}/schedules`);
};

export const createDoctorSchedule = async (doctorId, scheduleData) => {
  return api.post(`/doctors/${doctorId}/schedules`, scheduleData);
};

export const updateSchedule = async (scheduleId, updateData) => {
  return api.put(`/schedules/${scheduleId}`, updateData);
};

export const deleteSchedule = async (scheduleId) => {
  return api.delete(`/schedules/${scheduleId}`);
};

/**
 * Section 15: Available Slot API
 * GET /api/doctors/:doctorId/available-slots?date=YYYY-MM-DD
 */
export const getAvailableSlots = async (doctorId, dateString) => {
  return api.get(`/doctors/${doctorId}/available-slots`, {
    params: { date: dateString },
  });
};

export const scheduleService = {
  getDoctorSchedules,
  createDoctorSchedule,
  updateSchedule,
  deleteSchedule,
  getAvailableSlots,
  getDoctorAvailableSlots: getAvailableSlots,
};

export default scheduleService;

