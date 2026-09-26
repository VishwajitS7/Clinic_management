const mongoose = require('mongoose');

const prescriptionItemSchema = new mongoose.Schema(
  {
    medicineName: {
      type: String,
      required: [true, 'Medicine name is required'],
      trim: true,
    },
    dosage: {
      type: String,
      required: [true, 'Dosage is required (e.g. 500 mg)'],
      trim: true,
    },
    frequency: {
      type: String,
      required: [true, 'Frequency is required (e.g. Twice daily)'],
      trim: true,
    },
    duration: {
      type: String,
      required: [true, 'Duration is required (e.g. 5 days)'],
      trim: true,
    },
    route: {
      type: String,
      default: 'Oral',
      trim: true,
    },
    instructions: {
      type: String,
      trim: true,
    },
  },
  { _id: true }
);

const prescriptionSchema = new mongoose.Schema(
  {
    consultation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Consultation',
      required: [true, 'Consultation reference is required'],
      unique: true,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: [true, 'Doctor reference is required'],
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: [true, 'Patient reference is required'],
    },
    prescriptionDate: {
      type: Date,
      default: Date.now,
    },
    items: {
      type: [prescriptionItemSchema],
      validate: {
        validator: function (items) {
          return items && items.length > 0;
        },
        message: 'A prescription must contain at least one medicine item',
      },
    },
    instructions: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
prescriptionSchema.index({ patient: 1, prescriptionDate: -1 });
prescriptionSchema.index({ doctor: 1, prescriptionDate: -1 });

const Prescription = mongoose.model('Prescription', prescriptionSchema);

module.exports = Prescription;
