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
        "Technology",
        "History",
        "Biography",
        "Autobiography",
        "Mystery",
        "Thriller",
        "Horror",
        "Romance",
        "Fantasy",
        "Science Fiction",
        "Adventure",
        "Drama",
        "Comedy",
        "Poetry",
        "Philosophy",
        "Religion",
        "Self-Help",
        "Health",
        "Travel",
        "Cooking",
        "Art",
        "Music",
        "Sports",
        "Business",
        "Economics",
        "Politics",
        "Law",
        "Medicine",
        "Psychology",
        "Education",
        "Children",
        "Young Adult",
        "Academic",
        "Reference",
        "Textbook",
        "Coding",
        "Programming",
        "Computer Science",
        "Mathematics",
        "Physics",
        "Chemistry",
        "Biology",
        "Engineering",
        "Architecture",
        "Design",
        "Photography"
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
    // Enhanced image support with Cloudinary integration
    coverImage: {
      public_id: {
        type: String,
        default: null
      },
      url: {
        type: String,
        default: null
      },
      width: {
        type: Number,
        default: null
      },
      height: {
        type: Number,
        default: null
      },
      format: {
        type: String,
        default: null
      },
      uploadedAt: {
        type: Date,
        default: null
      }
    },
    // Enhanced metadata
    metadata: {
      pages: {
        type: Number,
        default: null
      },
      language: {
        type: String,
        default: 'English',
        trim: true
      },
      edition: {
        type: String,
        default: null,
        trim: true
      },
      weight: {
        type: Number, // in grams
        default: null
      },
      dimensions: {
        length: Number, // in cm
        width: Number,  // in cm
        height: Number  // in cm
      }
    },
    // Enhanced availability tracking
    availability: {
      isAvailable: {
        type: Boolean,
        default: true
      },
      reservedCount: {
        type: Number,
        default: 0
      },
      borrowedCount: {
        type: Number,
        default: 0
      }
    },
    // Rating and review system
    rating: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
      },
      count: {
        type: Number,
        default: 0
      }
    },
    // Tags for better categorization
    tags: [{
      type: String,
      trim: true
    }],
    // Status tracking
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'Maintenance', 'Lost', 'Damaged'],
      default: 'Active'
    }
  },
  {
    timestamps: true,
  }
);

// Virtual for total available copies
bookSchema.virtual('availableCopies').get(function() {
  return this.quantity - (this.availability.borrowedCount + this.availability.reservedCount);
});

// Virtual for book URL slug
bookSchema.virtual('slug').get(function() {
  return this.title.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-');
});

// Method to check if book is available for borrowing
bookSchema.methods.isAvailableForBorrow = function() {
  return this.status === 'Active' && 
         this.availability.isAvailable && 
         this.availableCopies > 0;
};

// Method to update availability after borrow/return
bookSchema.methods.updateAvailability = function(action, count = 1) {
  if (action === 'borrow') {
    this.availability.borrowedCount += count;
  } else if (action === 'return') {
    this.availability.borrowedCount = Math.max(0, this.availability.borrowedCount - count);
  } else if (action === 'reserve') {
    this.availability.reservedCount += count;
  } else if (action === 'unreserve') {
    this.availability.reservedCount = Math.max(0, this.availability.reservedCount - count);
  }
  
  // Update availability status
  this.availability.isAvailable = this.availableCopies > 0;
  return this.save();
};

// Method to update rating
bookSchema.methods.updateRating = function(newRating) {
  const currentTotal = this.rating.average * this.rating.count;
  this.rating.count += 1;
  this.rating.average = (currentTotal + newRating) / this.rating.count;
  return this.save();
};

// Static method to search books
bookSchema.statics.searchBooks = function(query, options = {}) {
  const {
    genre,
    author,
    status = 'Active',
    availableOnly = false,
    limit = 20,
    skip = 0,
    sortBy = 'title',
    sortOrder = 1
  } = options;
  
  const searchCriteria = {
    status,
    $or: [
      { title: { $regex: query, $options: 'i' } },
      { author: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
      { tags: { $in: [new RegExp(query, 'i')] } }
    ]
  };
  
  if (genre) {
    searchCriteria.genre = genre;
  }
  
  if (author) {
    searchCriteria.author = { $regex: author, $options: 'i' };
  }
  
  if (availableOnly) {
    searchCriteria['availability.isAvailable'] = true;
    searchCriteria.$expr = { $gt: ['$quantity', { $add: ['$availability.borrowedCount', '$availability.reservedCount'] }] };
  }
  
  const sortOptions = {};
  sortOptions[sortBy] = sortOrder;
  
  return this.find(searchCriteria)
    .sort(sortOptions)
    .limit(limit)
    .skip(skip);
};

// Pre-save middleware to ensure data consistency
bookSchema.pre('save', function(next) {
  // Ensure availability counts don't exceed quantity
  const totalAllocated = this.availability.borrowedCount + this.availability.reservedCount;
  if (totalAllocated > this.quantity) {
    const error = new Error('Total borrowed and reserved copies cannot exceed total quantity');
    return next(error);
  }
  
  // Update availability status
  this.availability.isAvailable = this.availableCopies > 0 && this.status === 'Active';
  
  // Ensure rating is within valid range
  if (this.rating.average < 0) this.rating.average = 0;
  if (this.rating.average > 5) this.rating.average = 5;
  
  next();
});

// Text search index for books
bookSchema.index({ title: 'text', author: 'text', description: 'text', tags: 'text' });

// Performance indexes
bookSchema.index({ genre: 1, 'availability.isAvailable': 1 });
bookSchema.index({ author: 1 });
bookSchema.index({ createdAt: -1 });
bookSchema.index({ 'rating.average': -1 });

export const Book = mongoose.model("Book", bookSchema);