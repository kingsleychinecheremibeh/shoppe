import express from "express";
import {
  initializePayment,
  handleStripeWebhook,
  handlePaystackWebhook,
} from "../controllers/paymentController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Initialize endpoint requires active authentication
router.post("/initialize", protect, initializePayment);

// Stripe webhook receives a raw body parser in app.js before JSON parsing.
router.post("/stripe-webhook", handleStripeWebhook);

// Paystack webhook receives a raw body parser in app.js before JSON parsing.
router.post("/paystack-webhook", handlePaystackWebhook);

export default router;
