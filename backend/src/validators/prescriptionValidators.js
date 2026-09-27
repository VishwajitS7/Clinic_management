const AppError = require('../utils/AppError');

/**
 * Validates prescription creation payload
 */
const validateCreatePrescription = (data) => {
  const errors = [];
  const { consultationId, items } = data;

  if (!consultationId) {
    errors.push('Consultation ID is required');
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    errors.push('Prescription must contain at least one medicine item');
  } else {
    items.forEach((item, index) => {
      const itemNum = index + 1;
      if (!item.medicineName || !item.medicineName.trim()) {
        errors.push(`Medicine #${itemNum}: name is required`);
      }
      if (!item.dosage || !item.dosage.trim()) {
        errors.push(`Medicine #${itemNum}: dosage is required (e.g. 500 mg)`);
      }
      if (!item.frequency || !item.frequency.trim()) {
        errors.push(`Medicine #${itemNum}: frequency is required (e.g. Twice daily)`);
      }
      if (!item.duration || !item.duration.trim()) {
        errors.push(`Medicine #${itemNum}: duration is required (e.g. 5 days)`);
      }
    });
  }

  if (errors.length > 0) {
    throw new AppError(errors.join(', '), 400);
  }
};

/**
 * Validates prescription update payload
 */
const validateUpdatePrescription = (data) => {
  const errors = [];
  const { items } = data;

  if (items !== undefined) {
    if (!Array.isArray(items) || items.length === 0) {
      errors.push('Prescription must contain at least one medicine item');
    } else {
      items.forEach((item, index) => {
        const itemNum = index + 1;
        if (!item.medicineName || !item.medicineName.trim()) {
          errors.push(`Medicine #${itemNum}: name is required`);
        }
        if (!item.dosage || !item.dosage.trim()) {
          errors.push(`Medicine #${itemNum}: dosage is required`);
        }
        if (!item.frequency || !item.frequency.trim()) {
          errors.push(`Medicine #${itemNum}: frequency is required`);
        }
        if (!item.duration || !item.duration.trim()) {
          errors.push(`Medicine #${itemNum}: duration is required`);
        }
      });
    }
  }

  if (errors.length > 0) {
    throw new AppError(errors.join(', '), 400);
  }
};

module.exports = {
  validateCreatePrescription,
  validateUpdatePrescription,
};
