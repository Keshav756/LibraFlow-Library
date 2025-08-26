class ErrorHandler extends Error {
<<<<<<< HEAD
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
    }
}

// Central error handling middleware
=======
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

>>>>>>> 1730d72 (final commit)
export const errorMiddleware = (err, req, res, next) => {
  err.message = err.message || "Internal Server Error";
  err.statusCode = err.statusCode || 500;

<<<<<<< HEAD
    // Duplicate key error (MongoDB)
    if (err.code === 11000) {
        const message = `Duplicate ${Object.keys(err.keyValue)} entered.`;
        err = new ErrorHandler(message, 400);
    }

    // JWT errors
    if (err.name === "JsonWebTokenError") {
        err = new ErrorHandler("Json Web Token is invalid. Try again.", 401);
    }
    if (err.name === "TokenExpiredError") {
        err = new ErrorHandler("Json Web Token is expired. Try again.", 401);
    }

    // Invalid MongoDB ObjectId
    if (err.name === "CastError") {
        err = new ErrorHandler(`Resource not found. Invalid: ${err.path}`, 400);
    }

    const errorMessage = err.errors
        ? Object.values(err.errors).map((error) => error.message).join(" ")
        : err.message;

    return res.status(err.statusCode).json({
        success: false,
        message: errorMessage,
    });
=======
  if (err.code === 11000) {
    err = new ErrorHandler(`Duplicate ${Object.keys(err.keyValue)} entered`, 400);
  }
  if (err.name === "JsonWebTokenError") err = new ErrorHandler("Invalid Token", 400);
  if (err.name === "TokenExpiredError") err = new ErrorHandler("Token Expired", 400);
  if (err.name === "CastError") err = new ErrorHandler(`Resource not found: ${err.path}`, 400);

  const message = err.errors ? Object.values(err.errors).map(e => e.message).join(" ") : err.message;

  return res.status(err.statusCode).json({ success: false, message });
>>>>>>> 1730d72 (final commit)
};

export default ErrorHandler;
