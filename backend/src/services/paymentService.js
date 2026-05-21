import Stripe from "stripe";
import axios from "axios";
import crypto from "crypto";
import { AppError } from "../utils/AppError.js";
import { orderRepository } from "../repositories/orderRepository.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_dummy");

const toMinorUnit = (amount) => Math.round(Number(amount) * 100);
const isStripeEnabled = () => process.env.STRIPE_ENABLED === "true";
const buildCheckoutCallbackUrl = (orderId) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const callbackUrl = new URL("/checkout/success", frontendUrl);
  callbackUrl.searchParams.set("orderId", orderId);
  return callbackUrl.toString();
};

const markOrderPaidFromWebhook = async ({ orderId, gateway, paidAmount }) => {
  if (!orderId) {
    throw new AppError("Payment metadata missing order ID", 400);
  }

  const order = await orderRepository.findOrderById(orderId);
  if (!order) {
    throw new AppError("Order not found", 404);
  }

  if (order.paymentGateway && order.paymentGateway !== gateway) {
    throw new AppError("Payment gateway does not match order", 400);
  }

  if (order.status === "PAID") {
    return { orderId, status: "PAID", alreadyProcessed: true };
  }

  if (order.status !== "PENDING") {
    throw new AppError("Order is not payable", 400);
  }

  const actualAmount = Number(paidAmount);
  const expectedAmount = toMinorUnit(order.total);
  if (!Number.isFinite(actualAmount) || actualAmount !== expectedAmount) {
    throw new AppError("Payment amount does not match order total", 400);
  }

  await orderRepository.updateOrderStatus(orderId, "PAID");
  return { orderId, status: "PAID" };
};

export const paymentService = {
  /**
   * Initialize a payment session for Stripe or Paystack
   * @param {Object} params - { orderId, gateway, email, userId }
   */
  async initialize({ orderId, gateway, email, userId }) {
    // 1. Double check order exists in database
    const order = await orderRepository.findOrderById(orderId);
    if (!order || order.userId !== userId) {
      throw new AppError("Order not found", 404);
    }

    if (order.status !== "PENDING") {
      throw new AppError("Order is not payable", 400);
    }

    const amount = Number(order.total);
    if (Number.isNaN(amount) || amount <= 0) {
      throw new AppError("Invalid order amount", 400);
    }
    const amountInMinorUnit = toMinorUnit(amount);

    // A. Handle Stripe Payment Intent
    if (gateway === "STRIPE") {
      if (!isStripeEnabled()) {
        throw new AppError("Stripe checkout is not enabled", 400);
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInMinorUnit,
        currency: "ngn",
        metadata: { orderId, userId },
        automatic_payment_methods: { enabled: true },
      });

      return {
        gateway: "STRIPE",
        clientSecret: paymentIntent.client_secret,
      };
    }

    // B. Handle Paystack Transaction
    if (gateway === "PAYSTACK") {
      const paystackResponse = await axios.post(
        "https://api.paystack.co/transaction/initialize",
        {
          email,
          amount: amountInMinorUnit,
          metadata: { orderId, userId },
          callback_url: buildCheckoutCallbackUrl(orderId),
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      const { authorization_url, reference } = paystackResponse.data.data;

      return {
        gateway: "PAYSTACK",
        authorizationUrl: authorization_url,
        reference,
      };
    }

    throw new AppError("Unsupported payment gateway selected", 400);
  },

  /**
   * Process and verify verified Stripe webhook events
   * @param {Object} rawBody - Raw buffer payload of the webhook request
   * @param {string} signature - Stripe signature header
   */
  async verifyStripeEvent(rawBody, signature) {
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      throw new AppError(`Stripe Webhook Signature Verification Failed: ${err.message}`, 400);
    }

    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object;
      const { orderId } = paymentIntent.metadata;

      return markOrderPaidFromWebhook({
        orderId,
        gateway: "STRIPE",
        paidAmount: paymentIntent.amount_received ?? paymentIntent.amount,
      });
    }

    return null;
  },

  /**
   * Process and verify verified Paystack webhook events
   * @param {Object|Buffer} rawBody - Raw buffer or parsed payload of the webhook request
   * @param {string} signature - Paystack signature header
   */
  async verifyPaystackEvent(rawBody, signature) {
    const rawStringBody = Buffer.isBuffer(rawBody) ? rawBody.toString("utf8") : JSON.stringify(rawBody);
    const body = Buffer.isBuffer(rawBody) ? JSON.parse(rawStringBody) : rawBody;

    const hash = crypto
      .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
      .update(rawStringBody)
      .digest("hex");

    if (hash !== signature) {
      throw new AppError("Paystack Webhook Signature Verification Failed", 400);
    }

    if (body.event === "charge.success") {
      const { orderId } = body.data.metadata;

      return markOrderPaidFromWebhook({
        orderId,
        gateway: "PAYSTACK",
        paidAmount: body.data.amount,
      });
    }

    return null;
  },
};
