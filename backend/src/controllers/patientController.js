const patientService = require('../services/patientService');
const { sendSuccess } = require('../utils/apiResponse');

const getPatients = async (req, res, next) => {
  try {
    const { page, limit, search, gender, bloodGroup, isActive } = req.query;
    const result = await patientService.getAllPatients({
      page,
      limit,
      search,
      gender,
      bloodGroup,
      isActive,
    });

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Patients retrieved successfully',
      data: result.patients,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

const getPatient = async (req, res, next) => {
  try {
    const result = await patientService.getPatientById(req.params.id);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Patient details retrieved successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const createPatient = async (req, res, next) => {
  try {
    const patient = await patientService.createPatient(req.body);

    return sendSuccess(res, {
      statusCode: 201,
      message: 'Patient registered successfully',
      data: patient,
    });
  } catch (error) {
    next(error);
  }
};

const updatePatient = async (req, res, next) => {
  try {
    const patient = await patientService.updatePatient(req.params.id, req.body);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Patient updated successfully',
      data: patient,
    });
  } catch (error) {
    next(error);
  }
};

const updatePatientStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    const patient = await patientService.togglePatientStatus(req.params.id, isActive);

    return sendSuccess(res, {
      statusCode: 200,
      message: `Patient ${patient.isActive ? 'activated' : 'deactivated'} successfully`,
      data: patient,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPatients,
  getPatient,
  createPatient,
  updatePatient,
  updatePatientStatus,
};
