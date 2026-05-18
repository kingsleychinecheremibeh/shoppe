import Stripe from "stripe";
import axios from "axios";
import crypto from "crypto";
import { AppError } from "../utils/AppError.js";
import { orderRepository } from "../repositories/orderRepository.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_dummy");

export const paymentService = {
  /**
   * Initialize a payment session for Stripe or Paystack
   * @param {Object} params - { amount, orderId, gateway, email, userId }
   */
  async initialize({ amount, orderId, gateway, email, userId }) {
    // 1. Double check order exists in database
    const order = await orderRepository.findOrderById(orderId);
    if (!order) {
      throw new AppError("Order not found", 404);
    }

    // A. Handle Stripe Payment Intent
    if (gateway === "STRIPE") {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // In cents
        currency: "usd",
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
          amount: Math.round(amount * 100), // In kobo/cents
          metadata: { orderId, userId },
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
      
      // Update order status securely
      await orderRepository.updateOrderStatus(orderId, "PAID");
      return { orderId, status: "PAID" };
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
      
      // Update order status securely
      await orderRepository.updateOrderStatus(orderId, "PAID");
      return { orderId, status: "PAID" };
    }

    return null;
  },
};
