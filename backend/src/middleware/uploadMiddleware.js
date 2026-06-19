import multer from "multer";
import { AppError } from "../utils/AppError.js";

// Enforce strict file types (only common web images)
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError("Invalid file type. Only JPEG, PNG, WEBP, and GIF images are allowed.", 400), false);
  }
};

// Enforce strict file size limits (15MB maximum)
export const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB
  },
});

const getDetectedImageMimeType = (buffer) => {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) return null;

  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }

  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }

  const header = buffer.subarray(0, 6).toString("ascii");
  if (header === "GIF87a" || header === "GIF89a") {
    return "image/gif";
  }

  const riff = buffer.subarray(0, 4).toString("ascii");
  const webp = buffer.subarray(8, 12).toString("ascii");
  if (riff === "RIFF" && webp === "WEBP") {
    return "image/webp";
  }

  return null;
};

export const verifyImageFileSignature = (req, res, next) => {
  if (!req.file) {
    return next();
  }

  const detectedMimeType = getDetectedImageMimeType(req.file.buffer);

  if (!detectedMimeType || detectedMimeType !== req.file.mimetype) {
    return next(new AppError("Uploaded file content does not match an allowed image type.", 400));
  }

  return next();
};

export default upload;
