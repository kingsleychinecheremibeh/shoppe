import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieparser from 'cookie-parser';
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
import shippingRoutes from './routes/shippingRoutes.js';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from '../swagger.json' with { type: 'json' };

import { AppError } from './utils/AppError.js';
import { errorHandler } from './middleware/errorMiddleware.js';
import { requireAllowedOrigin } from './middleware/originMiddleware.js';


export const app = express();
app.set('trust proxy', 1);
app.use(helmet());

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

app.use(cookieparser());
app.use('/api', requireAllowedOrigin);
app.use(express.json({ 
  limit: '10kb',
  verify: (req, res, buf) => {
    if (req.originalUrl && req.originalUrl.includes('webhook')) {
      req.rawBody = buf;
    }
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

const apilimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests, slow down please.',
});

app.use('/api', apilimiter);

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
app.use('/api/v1/shipping-methods', shippingRoutes);

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
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(errorHandler);

export default app;
