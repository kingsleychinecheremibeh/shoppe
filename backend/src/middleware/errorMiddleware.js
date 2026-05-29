import { logger } from "../utils/logger.js";

export const errorHandler = (err, req, res, next) => {
  const statusCode = err.code === "EBADCSRFTOKEN" ? 403 : err.statusCode || 500;
  const resolvedMessage = err.code === "EBADCSRFTOKEN" ? "Invalid CSRF token" : err.message;
  const message = statusCode === 500 ? 'Internal Server Error' : resolvedMessage;

  if (process.env.NODE_ENV !== 'test') {
    if (statusCode >= 500) {
      logger.error(err.message, { stack: err.stack })
    } else if (statusCode !== 401) {
      logger.warn(err.message, { statusCode })
    }
  }

  const status = typeof err.status === "string" ? err.status : (statusCode >= 500 ? 'error' : 'fail');

  res.status(statusCode).json({
    status,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
