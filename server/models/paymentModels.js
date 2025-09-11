import mongoose from "mongoose";

const paymentOrderSchema = new mongoose.Schema({
  borrowId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Borrow',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  razorpayOrderId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'INR'
  },
  status: {
    type: String,
    enum: ['created', 'attempted', 'paid', 'failed', 'abandoned'],
    default: 'created'
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    index: true
  }
}, {
  timestamps: true
});

// Index for cleanup of abandoned orders
paymentOrderSchema.index({ createdAt: 1 }, { expireAfterSeconds: 3600 }); // 1 hour

export const PaymentOrder = mongoose.model('PaymentOrder', paymentOrderSchema);