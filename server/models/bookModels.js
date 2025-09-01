import mongoose from "mongoose";

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    author: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: false,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    available: {
      type: Boolean,
      default: true,
    },
    genre: {    
      type: String,
      required: true,
      enum: [
        "Fiction",
        "Non-Fiction",
        "Science",
        "History",
        "Biography",
        "Mystery",
        "Thriller",
        "Horror",
        "Coding",
        "Programming",
      ],
    },
    publishedDate: {
      type: Date,
      required: true,
    },
    publisher: {
      type: String,
      required: true,
      trim: true,
    },
    ISBN: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Book = mongoose.model("Book", bookSchema);