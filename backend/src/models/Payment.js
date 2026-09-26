const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    paymentCode: {
      type: String,
      required: [true, 'Payment code is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    invoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice',
      required: [true, 'Invoice reference is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [0.01, 'Payment amount must be greater than zero'],
    },
    paymentMethod: {
      type: String,
      enum: {
        values: ['CASH', 'CARD', 'UPI', 'ONLINE'],
        message: '{VALUE} is not a valid payment method',
      },
      required: [true, 'Payment method is required'],
    },
    transactionReference: {
      type: String,
      trim: true,
    },
    paidAt: {
      type: Date,
      default: Date.now,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User recording payment is required'],
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
paymentSchema.index({ invoice: 1 });
paymentSchema.index({ paidAt: -1 });

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
