import { paymentService } from "../services/paymentService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";

/**
 * Initialize payment session
 */
export const initializePayment = asyncHandler(async (req, res) => {
  const { amount, orderId, gateway } = req.body;
  const email = req.user.email;
  const userId = req.user.id;

  if (!amount || !orderId || !gateway) {
    throw new AppError("Amount, orderId, and gateway selection are required", 400);
  }

  const result = await paymentService.initialize({
    amount: Number(amount),
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
  console.log("[PAYSTACK WEBHOOK] Received webhook request!");
  const signature = req.headers["x-paystack-signature"];
  console.log("[PAYSTACK WEBHOOK] Signature header:", signature);

  if (!signature) {
    console.error("[PAYSTACK WEBHOOK] Error: Signature header missing!");
    throw new AppError("Paystack signature header missing", 400);
  }

  const rawBody = req.rawBody || req.body;
  console.log("[PAYSTACK WEBHOOK] Raw body buffer present:", Buffer.isBuffer(req.rawBody));

  try {
    const result = await paymentService.verifyPaystackEvent(rawBody, signature);
    console.log("[PAYSTACK WEBHOOK] Signature successfully verified! Result:", result);
    
    res.status(200).json({
      status: "success",
      received: true,
      data: result,
    });
  } catch (err) {
    console.error("[PAYSTACK WEBHOOK] Signature verification failed or error thrown:", err.message);
    res.status(err.statusCode || 400).json({
      status: "fail",
      message: err.message,
    });
  }
});
