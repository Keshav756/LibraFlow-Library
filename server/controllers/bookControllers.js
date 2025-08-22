import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/errorMiddlewares.js";
import { Book } from "../models/bookModels.js";

// Add a new book
export const addBook = catchAsyncErrors(async (req, res, next) => {
  const { books } = req.body;

  // Check if books is an array (multiple books) or single book object
  if (Array.isArray(books)) {
    if (books.length === 0) {
      return next(new ErrorHandler("Please provide at least one book.", 400));
    }

    const createdBooks = [];
    const errors = [];

    for (let i = 0; i < books.length; i++) {
      const bookData = books[i];
      const {
        title,
        author,
        description,
        price,
        quantity,
        genre,
        publishedDate,
        publisher,
        ISBN,
        availability
      } = bookData;

      if (!title || !author || !price || !quantity || !genre || !publishedDate || !publisher || !ISBN) {
        errors.push(`Book ${i + 1}: Please enter all required fields (title, author, price, quantity, genre, publishedDate, publisher, ISBN).`);
        continue;
      }

      const existingBook = await Book.findOne({ ISBN });
      if (existingBook) {
        errors.push(`Book ${i + 1}: ISBN ${ISBN} already exists.`);
        continue;
      }

      try {
        const book = await Book.create({
          title,
          author,
          description: description || undefined,
          price,
          quantity,
          genre,
          publishedDate,
          publisher,
          ISBN,
          availability: availability !== undefined ? availability : quantity > 0
        });
        createdBooks.push(book);
      } catch (error) {
        errors.push(`Book ${i + 1}: ${error.message}`);
      }
    }

    if (errors.length > 0 && createdBooks.length === 0) {
      return next(new ErrorHandler(`Failed to add books: ${errors.join(', ')}`, 400));
    }

    const message = createdBooks.length === books.length
      ? `${createdBooks.length} book(s) added successfully.`
      : `${createdBooks.length} book(s) added successfully. ${errors.length} book(s) failed to add.`;

    res.status(201).json({
      success: true,
      message,
      books: createdBooks,
      errors: errors.length > 0 ? errors : undefined,
    });

  } else {
    const {
      title,
      author,
      description,
      price,
      quantity,
      genre,
      publishedDate,
      publisher,
      ISBN,
      availability
    } = req.body;

    if (!title || !author || !description || !price || !quantity || !genre || !publishedDate || !publisher || !ISBN) {
      return next(new ErrorHandler("Please enter all required fields (title, author, description, price, quantity, genre, publishedDate, publisher, ISBN).", 400));
    }

    const existingBook = await Book.findOne({ ISBN });
    if (existingBook) {
      return next(new ErrorHandler("ISBN already exists.", 400));
    }

    const book = await Book.create({
      title,
      author,
      description: description || undefined,
      price,
      quantity,
      genre,
      publishedDate,
      publisher,
      ISBN,
      availability: availability !== undefined ? availability : quantity > 0
    });

    res.status(201).json({
      success: true,
      message: "Book added successfully.",
      book,
    });
  }
});

// Update a book
export const updateBook = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const updateData = req.body;

  const book = await Book.findById(id);
  if (!book) {
    return next(new ErrorHandler("Book not found.", 404));
  }

  // Update only the fields that are provided
  const allowedUpdates = [
    'title', 'author', 'description', 'price', 'quantity', 
    'genre', 'publishedDate', 'publisher', 'ISBN', 'availability'
  ];
  
  allowedUpdates.forEach(field => {
    if (updateData[field] !== undefined) {
      book[field] = updateData[field];
    }
  });

  await book.save();

  res.status(200).json({
    success: true,
    message: "Book updated successfully.",
    book,
  });
});

// Delete a book
export const deleteBook = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const book = await Book.findById(id);

  if (!book) {
    return next(new ErrorHandler("Book not found.", 404));
  }

  await book.deleteOne();

  res.status(200).json({
    success: true,
    message: "Book deleted successfully.",
  });
});

// Get all books
export const getAllBooks = catchAsyncErrors(async (req, res, next) => {
  const books = await Book.find();
  res.status(200).json({
    success: true,
    books,
  });
});
