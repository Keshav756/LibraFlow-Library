// server/models/borrowModels.js
import mongoose from "mongoose";

const borrowSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // Index for faster queries
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true,
      index: true,
    },
    borrowDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    returnDate: {
      type: Date,
      default: null,
    },
    fine: {
      type: Number,
      default: 0,
      min: 0,
    },
    notified: {
      type: Boolean,
      default: false, // Optional: track if fine/return notifications were sent
    },
  },
  {
    timestamps: true, // Automatically manage createdAt & updatedAt
  }
);

// Optional: Index to speed up queries for overdue books
borrowSchema.index({ dueDate: 1, returnDate: 1 });

export const Borrow = mongoose.model("Borrow", borrowSchema);
