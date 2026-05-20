import { paymentService } from "../services/paymentService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";

/**
 * Initialize payment session
 */
export const initializePayment = asyncHandler(async (req, res) => {
  const { orderId, gateway } = req.body;
  const email = req.user.email;
  const userId = req.user.id;

  if (!orderId || !gateway) {
    throw new AppError("Order ID and gateway selection are required", 400);
  }

  const result = await paymentService.initialize({
    orderId,
    gateway: gateway.toUpperCase(),
    email,
    userId,
  });

  res.status(200).json({
    status: "success",
    data: result,
  });
});

/**
 * Handle Stripe Webhook
 */
export const handleStripeWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers["stripe-signature"];

  if (!signature) {
    throw new AppError("Stripe signature header missing", 400);
  }

  const rawBody = req.rawBody || req.body;
  const result = await paymentService.verifyStripeEvent(rawBody, signature);

  res.status(200).json({
    status: "success",
    received: true,
    data: result,
  });
});

/**
 * Handle Paystack Webhook
 */
export const handlePaystackWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers["x-paystack-signature"];

  if (!signature) {
    throw new AppError("Paystack signature header missing", 400);
  }

  const rawBody = req.rawBody || req.body;
  const result = await paymentService.verifyPaystackEvent(rawBody, signature);

  res.status(200).json({
    status: "success",
    received: true,
    data: result,
  });
});
