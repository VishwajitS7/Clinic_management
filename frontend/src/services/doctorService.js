import api from './api';

export const getDoctors = async (params = {}) => {
  return api.get('/doctors', { params });
};

export const getDoctorById = async (id) => {
  return api.get(`/doctors/${id}`);
};

export const getSpecializations = async () => {
  return api.get('/doctors/specializations');
};

export const createDoctor = async (doctorData) => {
  return api.post('/doctors', doctorData);
};

export const updateDoctor = async (id, doctorData) => {
  return api.put(`/doctors/${id}`, doctorData);
};

export const toggleDoctorStatus = async (id, isActive) => {
  return api.patch(`/doctors/${id}/status`, { isActive });
};
