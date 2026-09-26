import api from './api';

export const getPatients = async (params = {}) => {
  return api.get('/patients', { params });
};

export const getPatientById = async (id) => {
  return api.get(`/patients/${id}`);
};

export const createPatient = async (patientData) => {
  return api.post('/patients', patientData);
};

export const updatePatient = async (id, patientData) => {
  return api.put(`/patients/${id}`, patientData);
};

export const togglePatientStatus = async (id, isActive) => {
  return api.patch(`/patients/${id}/status`, { isActive });
};
