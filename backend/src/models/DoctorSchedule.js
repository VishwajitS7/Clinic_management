const mongoose = require('mongoose');

const doctorScheduleSchema = new mongoose.Schema(
  {
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: [true, 'Doctor reference is required'],
    },
    dayOfWeek: {
      type: String,
      enum: {
        values: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
        message: '{VALUE} is not a valid day of the week',
      },
      required: [true, 'Day of week is required'],
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required (e.g. 09:00)'],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Start time must be in HH:mm 24-hour format'],
    },
    endTime: {
      type: String,
      required: [true, 'End time is required (e.g. 13:00)'],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'End time must be in HH:mm 24-hour format'],
    },
    slotDuration: {
      type: Number,
      required: [true, 'Slot duration in minutes is required'],
      min: [5, 'Slot duration must be at least 5 minutes'],
      default: 30,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save validation: startTime must be before endTime
doctorScheduleSchema.pre('validate', function (next) {
  if (this.startTime && this.endTime && this.startTime >= this.endTime) {
    this.invalidate('startTime', 'Start time must be strictly before end time');
  }
  next();
});

// Compound index to quickly find a doctor's schedule on a specific day
doctorScheduleSchema.index({ doctor: 1, dayOfWeek: 1 });

const DoctorSchedule = mongoose.model('DoctorSchedule', doctorScheduleSchema);

module.exports = DoctorSchedule;
