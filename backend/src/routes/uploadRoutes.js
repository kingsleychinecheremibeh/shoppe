import express from "express";
import { upload } from "../middleware/uploadMiddleware.js";
import { protect } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";

const router = express.Router();

router.post(
  "/",
  protect,
  upload.single("image"),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new AppError("No file uploaded or file filtered out.", 400);
    }

    // Standardized secure URL back to the client
    const fileUrl = `/uploads/${req.file.filename}`;

    res.status(201).json({
      status: "success",
      message: "Image uploaded successfully",
      url: fileUrl,
    });
  })
);

export default router;
