import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieparser from 'cookie-parser';
import csrf from 'csurf';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/authRoutes.js';
import productRoute from './routes/productRoute.js';
import categoryRoute from './routes/categoryRoute.js';
import cartRoutes from './routes/cartRoutes.js';
import addressRoutes from './routes/addressRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import shippingRoutes from './routes/shippingRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from '../swagger.json' with { type: 'json' };

import { AppError } from './utils/AppError.js';
import { errorHandler } from './middleware/errorMiddleware.js';
import { requireAllowedOrigin } from './middleware/originMiddleware.js';
import { shouldUseSecureCookies } from './utils/authCookie.js';


export const app = express();
app.set('trust proxy', 1);

const normalizeOrigin = (origin) => {
  if (!origin) return null;
  try {
    return new URL(origin).origin;
  } catch {
    return origin.replace(/\/$/, '');
  }
};

const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.CORS_ORIGIN,
  ...(process.env.CORS_ORIGINS || '').split(','),
  'http://localhost:3000',
]
  .map((origin) => normalizeOrigin(origin?.trim()))
  .filter(Boolean);

const connectSources = ["'self'", ...allowedOrigins];
const imageSources = ["'self'", "data:", "blob:", "https://res.cloudinary.com"];

app.use(
  helmet({
    crossOriginOpenerPolicy: { policy: "same-origin" },
    crossOriginResourcePolicy: { policy: "same-origin" },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        baseUri: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        imgSrc: imageSources,
        connectSrc: connectSources,
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        fontSrc: ["'self'", "data:"],
        formAction: ["'self'"],
      },
    },
  })
);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(normalizeOrigin(origin))) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
};
app.use(cors(corsOptions));

const apilimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      status: "fail",
      message: "Too many requests. Please wait a few minutes and try again.",
    });
  },
});

app.use('/api', apilimiter);

app.use(cookieparser());
app.use('/api', requireAllowedOrigin);

const isPaymentWebhookRequest = (req) =>
  req.originalUrl?.includes('/payment/stripe-webhook') ||
  req.originalUrl?.includes('/payment/paystack-webhook');

const paymentWebhookRawParser = express.raw({
  type: 'application/json',
  limit: '1mb',
});

app.use('/api/v1/payment/stripe-webhook', paymentWebhookRawParser);
app.use('/api/v1/payment/paystack-webhook', paymentWebhookRawParser);

const jsonParser = express.json({
  limit: '10kb',
});
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    sameSite: shouldUseSecureCookies() ? 'none' : 'lax',
    secure: shouldUseSecureCookies(),
  },
});

app.use((req, res, next) => {
  if (isPaymentWebhookRequest(req)) {
    return next();
  }

  return jsonParser(req, res, next);
});
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use((req, res, next) => {
  if (isPaymentWebhookRequest(req)) {
    return next();
  }

  return csrfProtection(req, res, next);
});
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

if (process.env.NODE_ENV === 'production') {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
}

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/products', productRoute);
app.use('/api/v1/categories', categoryRoute);
app.use('/api/v1/cart', cartRoutes);
app.use('/api/v1/addresses', addressRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/payment', paymentRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/shipping-methods', shippingRoutes);
app.use('/api/v1/admin', adminRoutes);

// Serve uploaded image files statically
app.use('/uploads', express.static('uploads'));

app.get('/', (req, res) => {
  res.status(200).json({ message: 'API is running' });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'success', 
    message: 'Backend is healthy',
  });
});



app.use((req, res, next) => {
  next(new AppError("We could not find what you are looking for.", 404));
});

app.use(errorHandler);

export default app;
