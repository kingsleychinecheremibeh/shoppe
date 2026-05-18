import { logger } from "../utils/logger.js";

export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 ? 'Internal Server Error' : err.message;

  if (process.env.NODE_ENV !== 'test') {
    logger.error(err.message, { stack: err.stack });
  }

  const status = err.status || (statusCode >= 500 ? 'error' : 'fail');

  res.status(statusCode).json({
    status,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
