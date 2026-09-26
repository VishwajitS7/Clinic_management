const doctorService = require('../services/doctorService');
const { sendSuccess } = require('../utils/apiResponse');

const getDoctors = async (req, res, next) => {
  try {
    const { page, limit, search, specialization, isActive } = req.query;
    const result = await doctorService.getAllDoctors({
      page,
      limit,
      search,
      specialization,
      isActive,
    });

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Doctors retrieved successfully',
      data: result.doctors,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

const getDoctor = async (req, res, next) => {
  try {
    const result = await doctorService.getDoctorById(req.params.id);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Doctor details retrieved successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const createDoctor = async (req, res, next) => {
  try {
    const doctor = await doctorService.createDoctor(req.body);

    return sendSuccess(res, {
      statusCode: 201,
      message: 'Doctor profile and credentials created successfully',
      data: doctor,
    });
  } catch (error) {
    next(error);
  }
};

const updateDoctor = async (req, res, next) => {
  try {
    const doctor = await doctorService.updateDoctor(req.params.id, req.body);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Doctor profile updated successfully',
      data: doctor,
    });
  } catch (error) {
    next(error);
  }
};

const updateDoctorStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    const doctor = await doctorService.toggleDoctorStatus(req.params.id, isActive);

    return sendSuccess(res, {
      statusCode: 200,
      message: `Doctor ${doctor.isActive ? 'activated' : 'deactivated'} successfully`,
      data: doctor,
    });
  } catch (error) {
    next(error);
  }
};

const getSpecializations = async (req, res, next) => {
  try {
    const specializations = await doctorService.getDistinctSpecializations();

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Specializations retrieved successfully',
      data: specializations,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDoctors,
  getDoctor,
  createDoctor,
  updateDoctor,
  updateDoctorStatus,
  getSpecializations,
};
