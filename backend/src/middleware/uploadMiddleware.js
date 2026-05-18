import multer from "multer";
import path from "path";
import crypto from "crypto";
import { AppError } from "../utils/AppError.js";

// Setup storage engine with safe, randomized hashing for filenames to prevent path traversal
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const randomHash = crypto.randomBytes(16).toString("hex");
    const extension = path.extname(file.originalname).toLowerCase();
    cb(null, `${randomHash}${extension}`);
  },
});

// Enforce strict file types (only common web images)
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError("Invalid file type. Only JPEG, PNG, WEBP, and GIF images are allowed.", 400), false);
  }
};

// Enforce strict file size limits (5MB maximum)
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

export default upload;
