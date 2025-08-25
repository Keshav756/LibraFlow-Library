class ErrorHandler extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
    }
}

// Central error handling middleware
export const errorMiddleware = (err, req, res, next) => {
    err.message = err.message || "Internal Server Error";
    err.statusCode = err.statusCode || 500;

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
};

export default ErrorHandler;
