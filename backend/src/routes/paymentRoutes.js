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

// Stripe Webhook Endpoint (requires raw body parser)
router.post(
  "/stripe-webhook",
  express.raw({ type: "application/json" }),
  handleStripeWebhook
);

// Paystack Webhook Endpoint (requires raw body parser)
router.post(
  "/paystack-webhook",
  express.raw({ type: "application/json" }),
  handlePaystackWebhook
);

export default router;
