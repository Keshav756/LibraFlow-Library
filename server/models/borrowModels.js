import mongoose from "mongoose";

const borrowSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true,
    index: true
  },
  borrowDate: {
    type: Date,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: true
  },
  returnDate: {
    type: Date,
    default: null
  },
  fine: {
    type: Number,
    default: 0
  },
  fineAuditTrail: {
    type: [
      {
        timestamp: { type: Date, default: Date.now },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        oldFine: { type: Number },
        newFine: { type: Number },
        adjustment: { type: Number },
        reason: { type: String },
        notes: { type: String }
      }
    ],
    default: []
  },
  notified: {
    type: Boolean,
    default: false
  },
  lastNotified: {
    type: Date,
    default: null,
    index: true // Index for efficient queries
  }
}, {
  timestamps: true,
});

export const Borrow = mongoose.model('Borrow', borrowSchema);