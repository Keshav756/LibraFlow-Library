import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/errorMiddlewares.js";
import { Book } from "../models/bookModels.js";
import { handleFileUpload, deleteFromCloudinary } from "../utils/fileUploadHandler.js";
import { validateBookData } from "../middlewares/validation.js";
import envConfig from "../config/environment.js";

// Add a new book with enhanced validation and image upload
export const addBook = catchAsyncErrors(async (req, res, next) => {
  try {
    const { books } = req.body;
    const config = envConfig.getConfig();
    
    // Handle both single book and multiple books
    const booksToProcess = Array.isArray(books) ? books : [req.body];
    
    if (booksToProcess.length === 0) {
      return next(new ErrorHandler("Please provide at least one book.", 400));
    }
    
    const createdBooks = [];
    const errors = [];
    
    for (let i = 0; i < booksToProcess.length; i++) {
      const bookData = booksToProcess[i];
      
      try {
        // Validate book data using Joi schema
        const validatedData = await validateBookData(bookData);
        
        // Check for existing ISBN
        const existingBook = await Book.findOne({ ISBN: validatedData.ISBN });
        if (existingBook) {
          errors.push(`Book ${i + 1}: ISBN ${validatedData.ISBN} already exists.`);
          continue;
        }
        
        // Prepare book data with enhanced structure
        const bookPayload = {
          title: validatedData.title,
          author: validatedData.author,
          description: validatedData.description || '',
          price: validatedData.price,
          quantity: validatedData.quantity,
          genre: validatedData.genre,
          publishedDate: new Date(validatedData.publishedDate),
          publisher: validatedData.publisher,
          ISBN: validatedData.ISBN,
          metadata: {
            pages: validatedData.pages || null,
            language: validatedData.language || 'English',
            edition: validatedData.edition || null,
            weight: validatedData.weight || null,
            dimensions: validatedData.dimensions || {}
          },
          availability: {
            isAvailable: validatedData.quantity > 0,
            reservedCount: 0,
            borrowedCount: 0
          },
          rating: {
            average: 0,
            count: 0
          },
          tags: validatedData.tags || [],
          status: validatedData.status || 'Active'
        };
        
        // Handle optional cover image upload
        let coverImageData = null;
        
        // Check for cover image in request files
        const coverImageFile = req.files?.coverImage || req.files?.[`books[${i}][coverImage]`];
        
        if (coverImageFile) {
          try {
            console.log(`📸 Processing cover image for book ${i + 1}: ${validatedData.title}`);
            
            const uploadResult = await handleFileUpload(coverImageFile, 'IMAGE', {
              userId: req.user?.id || 'system',
              tags: ['book_cover', validatedData.genre.toLowerCase()],
              context: {
                book_title: validatedData.title,
                book_isbn: validatedData.ISBN
              }
            });
            
            if (uploadResult.success) {
              coverImageData = {
                public_id: uploadResult.data.public_id,
                url: uploadResult.data.url,
                width: uploadResult.data.width,
                height: uploadResult.data.height,
                format: uploadResult.data.format,
                uploadedAt: new Date()
              };
              
              console.log(`✅ Cover image uploaded successfully for: ${validatedData.title}`);
            }
          } catch (uploadError) {
            console.warn(`⚠️ Cover image upload failed for book ${i + 1}: ${uploadError.message}`);
            // Continue without image - don't fail the entire book creation
          }
        }
        
        // Add cover image data if uploaded
        if (coverImageData) {
          bookPayload.coverImage = coverImageData;
        }
        
        // Create the book
        const book = await Book.create(bookPayload);
        createdBooks.push(book);
        
        console.log(`✅ Book created successfully: ${book.title} (ID: ${book._id})`);
        
      } catch (error) {
        console.error(`❌ Error processing book ${i + 1}:`, error.message);
        errors.push(`Book ${i + 1}: ${error.message}`);
        continue;
      }
    }
    
    // Determine response based on results
    if (errors.length > 0 && createdBooks.length === 0) {
      return next(new ErrorHandler(`Failed to add books: ${errors.join(', ')}`, 400));
    }
    
    const message = createdBooks.length === booksToProcess.length
      ? `${createdBooks.length} book(s) added successfully.`
      : `${createdBooks.length} book(s) added successfully. ${errors.length} book(s) failed to add.`;
    
    // Enhanced response with detailed information
    res.status(201).json({
      success: true,
      message,
      data: {
        books: createdBooks.map(book => ({
          id: book._id,
          title: book.title,
          author: book.author,
          ISBN: book.ISBN,
          genre: book.genre,
          price: book.price,
          quantity: book.quantity,
          availableCopies: book.availableCopies,
          coverImage: book.coverImage,
          status: book.status,
          createdAt: book.createdAt
        })),
        summary: {
          totalProcessed: booksToProcess.length,
          successful: createdBooks.length,
          failed: errors.length,
          errors: errors.length > 0 ? errors : undefined
        }
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("❌ Unexpected error in addBook:", error);
    return next(new ErrorHandler("An unexpected error occurred while adding books.", 500));
  }
});

// Update a book with enhanced validation and optional image update
export const updateBook = catchAsyncErrors(async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Find the book
    const book = await Book.findById(id);
    if (!book) {
      return next(new ErrorHandler("Book not found.", 404));
    }
    
    // Validate update data if provided
    if (Object.keys(updateData).length > 0) {
      try {
        // Only validate fields that are being updated
        const fieldsToValidate = {};
        const allowedUpdates = [
          'title', 'author', 'description', 'price', 'quantity', 
          'genre', 'publishedDate', 'publisher', 'ISBN', 'pages',
          'language', 'edition', 'weight', 'dimensions', 'tags', 'status'
        ];
        
        allowedUpdates.forEach(field => {
          if (updateData[field] !== undefined) {
            fieldsToValidate[field] = updateData[field];
          }
        });
        
        // Basic validation for critical fields
        if (fieldsToValidate.ISBN && fieldsToValidate.ISBN !== book.ISBN) {
          const existingBook = await Book.findOne({ ISBN: fieldsToValidate.ISBN });
          if (existingBook) {
            return next(new ErrorHandler("ISBN already exists.", 400));
          }
        }
        
        // Update basic fields
        Object.keys(fieldsToValidate).forEach(field => {
          if (field === 'pages' || field === 'language' || field === 'edition' || field === 'weight') {
            if (!book.metadata) book.metadata = {};
            book.metadata[field] = fieldsToValidate[field];
          } else if (field === 'dimensions') {
            if (!book.metadata) book.metadata = {};
            book.metadata.dimensions = fieldsToValidate[field];
          } else if (field === 'tags') {
            book.tags = Array.isArray(fieldsToValidate[field]) ? fieldsToValidate[field] : [];
          } else {
            book[field] = fieldsToValidate[field];
          }
        });
        
      } catch (validationError) {
        return next(new ErrorHandler(`Validation error: ${validationError.message}`, 400));
      }
    }
    
    // Handle cover image update
    let imageUpdateResult = null;
    const coverImageFile = req.files?.coverImage;
    
    if (coverImageFile) {
      try {
        console.log(`📸 Updating cover image for book: ${book.title}`);
        
        // Delete old image if exists
        if (book.coverImage && book.coverImage.public_id) {
          try {
            await deleteFromCloudinary(book.coverImage.public_id, 'image');
            console.log(`🗑️ Old cover image deleted: ${book.coverImage.public_id}`);
          } catch (deleteError) {
            console.warn(`⚠️ Failed to delete old image: ${deleteError.message}`);
          }
        }
        
        // Upload new image
        const uploadResult = await handleFileUpload(coverImageFile, 'IMAGE', {
          userId: req.user?.id || 'system',
          tags: ['book_cover', book.genre.toLowerCase(), 'updated'],
          context: {
            book_title: book.title,
            book_isbn: book.ISBN,
            update_type: 'cover_image_update'
          }
        });
        
        if (uploadResult.success) {
          book.coverImage = {
            public_id: uploadResult.data.public_id,
            url: uploadResult.data.url,
            width: uploadResult.data.width,
            height: uploadResult.data.height,
            format: uploadResult.data.format,
            uploadedAt: new Date()
          };
          
          imageUpdateResult = {
            success: true,
            url: uploadResult.data.url
          };
          
          console.log(`✅ New cover image uploaded successfully for: ${book.title}`);
        }
        
      } catch (uploadError) {
        console.error(`❌ Cover image update failed: ${uploadError.message}`);
        imageUpdateResult = {
          success: false,
          error: uploadError.message
        };
        // Continue with book update even if image update fails
      }
    }
    
    // Update availability if quantity changed
    if (updateData.quantity !== undefined) {
      book.availability.isAvailable = book.availableCopies > 0 && book.status === 'Active';
    }
    
    // Save the updated book
    await book.save();
    
    console.log(`✅ Book updated successfully: ${book.title} (ID: ${book._id})`);
    
    // Enhanced response
    res.status(200).json({
      success: true,
      message: "Book updated successfully.",
      data: {
        book: {
          id: book._id,
          title: book.title,
          author: book.author,
          description: book.description,
          price: book.price,
          quantity: book.quantity,
          availableCopies: book.availableCopies,
          genre: book.genre,
          publishedDate: book.publishedDate,
          publisher: book.publisher,
          ISBN: book.ISBN,
          coverImage: book.coverImage,
          metadata: book.metadata,
          availability: book.availability,
          rating: book.rating,
          tags: book.tags,
          status: book.status,
          updatedAt: book.updatedAt
        },
        imageUpdate: imageUpdateResult,
        updatedFields: Object.keys(updateData)
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("❌ Unexpected error in updateBook:", error);
    return next(new ErrorHandler("An unexpected error occurred while updating the book.", 500));
  }
});

// Delete a book with image cleanup
export const deleteBook = catchAsyncErrors(async (req, res, next) => {
  try {
    const { id } = req.params;
    const book = await Book.findById(id);
    
    if (!book) {
      return next(new ErrorHandler("Book not found.", 404));
    }
    
    // Check if book can be deleted (not borrowed or reserved)
    if (book.availability.borrowedCount > 0 || book.availability.reservedCount > 0) {
      return next(new ErrorHandler(
        `Cannot delete book. ${book.availability.borrowedCount} copies are borrowed and ${book.availability.reservedCount} copies are reserved.`,
        400
      ));
    }
    
    let imageDeleteResult = null;
    
    // Delete cover image from Cloudinary if exists
    if (book.coverImage && book.coverImage.public_id) {
      try {
        console.log(`🗑️ Deleting cover image: ${book.coverImage.public_id}`);
        
        const deleteResult = await deleteFromCloudinary(book.coverImage.public_id, 'image');
        
        imageDeleteResult = {
          success: deleteResult.success,
          public_id: book.coverImage.public_id
        };
        
        if (deleteResult.success) {
          console.log(`✅ Cover image deleted successfully: ${book.coverImage.public_id}`);
        } else {
          console.warn(`⚠️ Failed to delete cover image: ${book.coverImage.public_id}`);
        }
        
      } catch (deleteError) {
        console.error(`❌ Error deleting cover image: ${deleteError.message}`);
        imageDeleteResult = {
          success: false,
          error: deleteError.message,
          public_id: book.coverImage.public_id
        };
        // Continue with book deletion even if image deletion fails
      }
    }
    
    // Store book information for response
    const deletedBookInfo = {
      id: book._id,
      title: book.title,
      author: book.author,
      ISBN: book.ISBN,
      coverImage: book.coverImage
    };
    
    // Delete the book
    await book.deleteOne();
    
    console.log(`✅ Book deleted successfully: ${deletedBookInfo.title} (ID: ${deletedBookInfo.id})`);
    
    res.status(200).json({
      success: true,
      message: "Book deleted successfully.",
      data: {
        deletedBook: deletedBookInfo,
        imageDelete: imageDeleteResult
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("❌ Unexpected error in deleteBook:", error);
    return next(new ErrorHandler("An unexpected error occurred while deleting the book.", 500));
  }
});

// Get all books with search, filtering, and pagination
export const getAllBooks = catchAsyncErrors(async (req, res, next) => {
  try {
    console.log(' getAllBooks - Request received:', {
      user: req.user ? `${req.user.email} (${req.user.role})` : 'No user',
      url: req.originalUrl,
      method: req.method
    });
    
    const { search, category, author, page = 1, limit = 12 } = req.query;
    
    // Build search query
    const query = {};
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { ISBN: { $regex: search, $options: "i" } },
        { author: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ];
    }
    
    if (category) query.category = category;
    if (author) query.author = author;
    
    // Execute query with pagination
    const books = await Book.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });
    
    // Get total count for pagination
    const total = await Book.countDocuments(query);
    
    console.log(' getAllBooks - Found', books.length, 'books');
    
    res.status(200).json({
      success: true,
      books,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalBooks: total,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("❌ Get all books error:", error);
    return next(new ErrorHandler("Failed to fetch books", 500));
  }
});

// Get a single book by ID with detailed information
export const getBookById = catchAsyncErrors(async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const book = await Book.findById(id);
    if (!book) {
      return next(new ErrorHandler("Book not found.", 404));
    }
    
    // Enhanced book data
    const enhancedBook = {
      id: book._id,
      title: book.title,
      author: book.author,
      description: book.description,
      price: book.price,
      quantity: book.quantity,
      availableCopies: book.availableCopies,
      genre: book.genre,
      publishedDate: book.publishedDate,
      publisher: book.publisher,
      ISBN: book.ISBN,
      coverImage: book.coverImage,
      metadata: book.metadata,
      availability: book.availability,
      rating: book.rating,
      tags: book.tags,
      status: book.status,
      isAvailableForBorrow: book.isAvailableForBorrow(),
      slug: book.slug,
      createdAt: book.createdAt,
      updatedAt: book.updatedAt
    };
    
    res.status(200).json({
      success: true,
      message: "Book retrieved successfully.",
      data: {
        book: enhancedBook
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("❌ Unexpected error in getBookById:", error);
    return next(new ErrorHandler("An unexpected error occurred while retrieving the book.", 500));
  }
});

// Update book availability (for borrowing/returning)
export const updateBookAvailability = catchAsyncErrors(async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action, count = 1 } = req.body;
    
    // Validate action
    const validActions = ['borrow', 'return', 'reserve', 'unreserve'];
    if (!validActions.includes(action)) {
      return next(new ErrorHandler(`Invalid action. Valid actions: ${validActions.join(', ')}`, 400));
    }
    
    const book = await Book.findById(id);
    if (!book) {
      return next(new ErrorHandler("Book not found.", 404));
    }
    
    // Check availability for borrow/reserve actions
    if ((action === 'borrow' || action === 'reserve') && book.availableCopies < count) {
      return next(new ErrorHandler(
        `Insufficient copies available. Available: ${book.availableCopies}, Requested: ${count}`,
        400
      ));
    }
    
    // Update availability
    await book.updateAvailability(action, count);
    
    res.status(200).json({
      success: true,
      message: `Book availability updated successfully (${action}: ${count}).`,
      data: {
        book: {
          id: book._id,
          title: book.title,
          quantity: book.quantity,
          availableCopies: book.availableCopies,
          availability: book.availability,
          isAvailableForBorrow: book.isAvailableForBorrow()
        },
        action: {
          type: action,
          count,
          timestamp: new Date().toISOString()
        }
      }
    });
    
  } catch (error) {
    console.error("❌ Unexpected error in updateBookAvailability:", error);
    return next(new ErrorHandler("An unexpected error occurred while updating book availability.", 500));
  }
});

// Get book statistics and analytics
export const getBookStatistics = catchAsyncErrors(async (req, res, next) => {
  try {
    const stats = await Book.aggregate([
      {
        $group: {
          _id: null,
          totalBooks: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
          totalBorrowed: { $sum: '$availability.borrowedCount' },
          totalReserved: { $sum: '$availability.reservedCount' },
          averagePrice: { $avg: '$price' },
          averageRating: { $avg: '$rating.average' },
          genreDistribution: { $push: '$genre' },
          statusDistribution: { $push: '$status' }
        }
      }
    ]);
    
    let statistics = {
      totalBooks: 0,
      totalQuantity: 0,
      totalBorrowed: 0,
      totalReserved: 0,
      totalAvailable: 0,
      averagePrice: 0,
      averageRating: 0,
      genreDistribution: {},
      statusDistribution: {}
    };
    
    if (stats.length > 0) {
      const data = stats[0];
      
      // Calculate genre distribution
      const genreCounts = {};
      data.genreDistribution.forEach(genre => {
        genreCounts[genre] = (genreCounts[genre] || 0) + 1;
      });
      
      // Calculate status distribution
      const statusCounts = {};
      data.statusDistribution.forEach(status => {
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });
      
      statistics = {
        totalBooks: data.totalBooks,
        totalQuantity: data.totalQuantity,
        totalBorrowed: data.totalBorrowed,
        totalReserved: data.totalReserved,
        totalAvailable: data.totalQuantity - data.totalBorrowed - data.totalReserved,
        averagePrice: Math.round(data.averagePrice * 100) / 100,
        averageRating: Math.round(data.averageRating * 100) / 100,
        genreDistribution: genreCounts,
        statusDistribution: statusCounts
      };
    }
    
    // Additional analytics
    const topRatedBooks = await Book.find({ 'rating.count': { $gte: 1 } })
      .sort({ 'rating.average': -1 })
      .limit(5)
      .select('title author rating.average rating.count');
    
    const recentBooks = await Book.find({ status: 'Active' })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title author createdAt');
    
    res.status(200).json({
      success: true,
      message: "Book statistics retrieved successfully.",
      data: {
        statistics,
        topRatedBooks,
        recentBooks,
        generatedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error("❌ Unexpected error in getBookStatistics:", error);
    return next(new ErrorHandler("An unexpected error occurred while retrieving book statistics.", 500));
  }
});