import { logger } from "../utils/logger.js";

const DEFAULT_ERROR_MESSAGE = "Something went wrong. Please try again.";
const DEFAULT_SERVER_ERROR_MESSAGE =
  "Something went wrong. Please try again later.";

const errorMessageByCode = {
  EBADCSRFTOKEN: "Your session expired. Please refresh the page and try again.",
  LIMIT_FILE_SIZE: "Uploaded file is too large. Maximum size is 15MB.",
  LIMIT_UNEXPECTED_FILE: "Please upload only one valid image file.",
  P2002: "That record already exists. Please use a different value.",
  P2003: "This action cannot be completed because related data is missing.",
  P2025: "We could not find the item you are trying to update.",
};

const getStatusCode = (err) => {
  if (err.code === "EBADCSRFTOKEN") return 403;
  if (err.code === "LIMIT_FILE_SIZE") return 413;
  if (err.type === "entity.too.large") return 413;
  if (err instanceof SyntaxError && "body" in err) return 400;
  if (err.code?.startsWith?.("P")) return 400;
  if (Number.isInteger(err.statusCode)) return err.statusCode;
  if (Number.isInteger(err.status)) return err.status;
  return 500;
};

const getPublicMessage = (err, statusCode, isProduction) => {
  if (err.type === "entity.too.large") {
    return "Request is too large. Please reduce the size and try again.";
  }

  if (err instanceof SyntaxError && "body" in err) {
    return "Request body is not valid JSON.";
  }

  if (errorMessageByCode[err.code]) {
    return errorMessageByCode[err.code];
  }

  if (statusCode === 404) {
    return err.message || "We could not find what you are looking for.";
  }

  if (statusCode === 401) {
    if (err.message === "Invalid email or password") {
      return err.message;
    }

    return "Please log in to continue.";
  }

  if (statusCode === 403) {
    return err.message || "You do not have permission to perform this action.";
  }

  if (statusCode === 500 && isProduction) {
    return DEFAULT_SERVER_ERROR_MESSAGE;
  }

  return err.message || DEFAULT_ERROR_MESSAGE;
};

export const errorHandler = (err, req, res, next) => {
  const isProduction = process.env.NODE_ENV === "production";
  const statusCode = getStatusCode(err);
  const message = getPublicMessage(err, statusCode, isProduction);

  if (process.env.NODE_ENV !== 'test') {
    if (statusCode >= 500) {
      logger.error(err.message, { stack: err.stack });
    } else if (statusCode !== 401) {
      logger.warn(err.message, { statusCode });
    }
  }

  const status =
    typeof err.status === "string"
      ? err.status
      : statusCode >= 500
        ? "error"
        : "fail";

  res.status(statusCode).json({
    status,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
