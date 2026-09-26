const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: [true, 'Item description is required'],
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
      default: 1,
    },
    unitPrice: {
      type: Number,
      required: [true, 'Unit price is required'],
      min: [0, 'Unit price cannot be negative'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
  },
  { _id: true }
);

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: [true, 'Invoice number is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: [true, 'Patient reference is required'],
    },
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      required: [true, 'Appointment reference is required'],
    },
    items: {
      type: [invoiceItemSchema],
      validate: {
        validator: function (items) {
          return items && items.length > 0;
        },
        message: 'An invoice must contain at least one line item',
      },
    },
    subtotal: {
      type: Number,
      required: [true, 'Subtotal is required'],
      min: [0, 'Subtotal cannot be negative'],
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, 'Discount cannot be negative'],
    },
    tax: {
      type: Number,
      default: 0,
      min: [0, 'Tax cannot be negative'],
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Total amount cannot be negative'],
    },
    amountPaid: {
      type: Number,
      default: 0,
      min: [0, 'Amount paid cannot be negative'],
    },
    amountDue: {
      type: Number,
      required: [true, 'Amount due is required'],
      min: [0, 'Amount due cannot be negative'],
    },
    status: {
      type: String,
      enum: {
        values: ['UNPAID', 'PARTIALLY_PAID', 'PAID', 'CANCELLED'],
        message: '{VALUE} is not a valid invoice status',
      },
      default: 'UNPAID',
    },
    issuedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-validate hook: Recalculate totals and status automatically on the backend
invoiceSchema.pre('validate', function (next) {
  if (this.items && this.items.length > 0) {
    this.items.forEach((item) => {
      item.amount = Number((item.quantity * item.unitPrice).toFixed(2));
    });

    const calculatedSubtotal = this.items.reduce((acc, item) => acc + item.amount, 0);
    this.subtotal = Number(calculatedSubtotal.toFixed(2));
    const discount = this.discount || 0;
    const tax = this.tax || 0;
    this.totalAmount = Number(Math.max(0, this.subtotal - discount + tax).toFixed(2));

    const paid = this.amountPaid || 0;
    this.amountDue = Number(Math.max(0, this.totalAmount - paid).toFixed(2));

    if (this.status !== 'CANCELLED') {
      if (paid === 0) {
        this.status = 'UNPAID';
      } else if (paid > 0 && paid < this.totalAmount) {
        this.status = 'PARTIALLY_PAID';
      } else if (paid >= this.totalAmount) {
        this.status = 'PAID';
      }
    }
  }
  next();
});

// Indexes
invoiceSchema.index({ patient: 1, createdAt: -1 });
invoiceSchema.index({ appointment: 1 });
invoiceSchema.index({ status: 1 });

const Invoice = mongoose.model('Invoice', invoiceSchema);

module.exports = Invoice;
