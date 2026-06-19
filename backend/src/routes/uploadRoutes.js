import express from "express";
import { upload, verifyImageFileSignature } from "../middleware/uploadMiddleware.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import cloudinary, { isCloudinaryConfigured } from "../config/cloudinary.js";

const router = express.Router();

const uploadToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "shoppe/products",
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(result);
      }
    );

    stream.end(file.buffer);
  });
};

router.post(
  "/",
  protect,
  adminOnly,
  upload.single("image"),
  verifyImageFileSignature,
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new AppError("No file uploaded or file filtered out.", 400);
    }

    if (!isCloudinaryConfigured()) {
      throw new AppError("Cloudinary upload is not configured.", 500);
    }

    const result = await uploadToCloudinary(req.file);

    if (!result?.secure_url) {
      throw new AppError("Cloudinary upload failed.", 502);
    }

    res.status(201).json({
      status: "success",
      message: "Image uploaded successfully",
      url: result.secure_url,
      publicId: result.public_id,
    });
  })
);

export default router;
