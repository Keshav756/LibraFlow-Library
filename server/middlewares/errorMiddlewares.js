class ErrorHandler extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const errorMiddleware = (err, req, res, next) => {
  err.message = err.message || "Internal Server Error";
  err.statusCode = err.statusCode || 500;

  if (err.code === 11000) {
    err = new ErrorHandler(`Duplicate ${Object.keys(err.keyValue)} entered`, 400);
  }
  if (err.name === "JsonWebTokenError") err = new ErrorHandler("Invalid Token", 400);
  if (err.name === "TokenExpiredError") err = new ErrorHandler("Token Expired", 400);
  if (err.name === "CastError") err = new ErrorHandler(`Resource not found: ${err.path}`, 400);

  const message = err.errors ? Object.values(err.errors).map(e => e.message).join(" ") : err.message;

  return res.status(err.statusCode).json({ success: false, message });
};

export default ErrorHandler;
