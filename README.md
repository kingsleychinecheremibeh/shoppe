# 🛍️ Shoppe — Full-Stack E-Commerce Platform

A production-ready e-commerce application built with the **PERN** stack (PostgreSQL, Express, React/Next.js, Node.js).

---

## 📦 Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| **Node.js + Express 5** | REST API server |
| **PostgreSQL + Prisma 7** | Database & ORM |
| **Redis** | Caching & session support |
| **JWT (access + refresh tokens)** | Authentication |
| **bcryptjs** | Password hashing |
| **Cloudinary** | Image uploads & storage |
| **Stripe / Paystack** | Payment processing |
| **Zod** | Request validation |
| **Helmet + CORS + Rate Limiting** | Security |
| **Winston + Pino** | Logging |
| **Swagger UI** | API documentation |
| **Jest + Supertest** | Testing |

### Frontend
| Technology | Purpose |
|---|---|
| **Next.js 16 (App Router)** | React framework |
| **TypeScript** | Type safety |
| **Tailwind CSS 4** | Styling |
| **React Hook Form + Zod** | Form handling & validation |
| **SWR** | Data fetching & caching |
| **Recharts** | Admin analytics charts |
| **Lucide React** | Icons |
| **Sonner** | Toast notifications |
| **Sentry** | Error monitoring |

---

## 🗂️ Project Structure

```
ecomerce-pern/
├── backend/                  # Express API server
│   ├── src/
│   │   ├── controllers/      # Route handlers
│   │   ├── services/         # Business logic
│   │   ├── repositories/     # Database access layer
│   │   ├── middleware/        # Auth, error handling, etc.
│   │   ├── routes/           # API route definitions
│   │   ├── validators/       # Zod schemas
│   │   ├── utils/            # Helpers (cookies, tokens, etc.)
│   │   └── config/           # App configuration
│   ├── prisma/
│   │   └── schema.prisma     # Database schema
│   ├── __tests__/            # Jest test suites
│   └── .env.example          # Environment variable template
│
└── frontend/
    └── shoppe/               # Next.js application
        ├── app/
        │   ├── (pages)/      # Route pages (home, products, cart, etc.)
        │   ├── admin/        # Admin dashboard
        │   ├── components/   # Shared UI components
        │   └── hooks/        # Custom React hooks
        └── lib/              # API clients, utilities
```

---

## ✨ Features

### Storefront
- 🏠 Product listing with category filtering and search
- 🛒 Shopping cart (add, update quantity, remove)
- 📦 Product detail pages with image gallery and color selection
- 💳 Checkout with address selection and shipping method choice
- 📬 Order history and status tracking
- 👤 User account management
- 🔔 In-app notifications

### Authentication & Security
- 🔑 JWT access tokens (15-minute expiry) + refresh tokens (7-day expiry) via HTTP-only cookies
- 🔄 Automatic silent token refresh with token rotation
- 🔒 Hashed refresh tokens stored in the database
- 🛡️ Session tracking (device, IP, user agent)
- 🚫 Rate limiting on all endpoints

### Admin Dashboard
- 📊 Analytics with charts (sales, revenue, orders)
- 🛍️ Product management (CRUD, image uploads, color variants)
- 🗂️ Category management
- 📋 Order management with status transitions
- 🚚 Shipping method management
- 👥 User management with role-based access (USER / MANAGER / ADMIN)
- 🔑 Granular manager permissions (orders, products, shipping, analytics)
- 📝 Audit logging

### Payments
- Stripe integration
- Paystack integration

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL
- Redis
- Cloudinary account (for image uploads)
- Stripe or Paystack account (for payments)

---

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd ecomerce-pern
```

---

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
npm install
```

Fill in your `.env` file (see [Environment Variables](#environment-variables) below).

Run database migrations:

```bash
npx prisma migrate deploy
npx prisma generate
```

Start the dev server:

```bash
npm run dev
```

The API will be available at **http://localhost:5000**

API docs (Swagger UI): **http://localhost:5000/api-docs**

---

### 3. Frontend Setup

```bash
cd frontend/shoppe
npm install
npm run dev
```

The app will be available at **http://localhost:3000**

---

## 🌍 Environment Variables

### Backend (`backend/.env`)

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/shoppe

# JWT
JWT_SECRET=your_access_token_secret_here
JWT_REFRESH_SECRET=your_refresh_token_secret_here

# Redis
REDIS_URL=redis://localhost:6379
CACHE_TTL_SECONDS=300

# CORS
FRONTEND_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000
CORS_ORIGINS=http://localhost:3000

# Cookies
COOKIE_SAMESITE=lax
COOKIE_DOMAIN=

# Cloudinary (image uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Payments
STRIPE_ENABLED=false
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
PAYSTACK_SECRET_KEY=sk_test_...
```

### Frontend (`frontend/shoppe/.env`)

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

## 📡 API Overview

Base URL: `http://localhost:5000/api/v1`

All protected endpoints require an authenticated session (cookies sent automatically by the browser).

| Resource | Endpoint | Auth |
|---|---|---|
| Auth | `/auth/register`, `/auth/login`, `/auth/logout`, `/auth/refresh-token`, `/auth/me` | — |
| Products | `/products` | Public (read), Admin (write) |
| Categories | `/categories` | Public (read), Admin (write) |
| Cart | `/cart` | User |
| Addresses | `/addresses` | User |
| Orders | `/orders` | User / Admin |
| Payments | `/payments` | User |
| Shipping | `/shipping` | Public (read), Admin (write) |
| Notifications | `/notifications` | User |
| Admin | `/admin/*` | Admin / Manager |
| Uploads | `/upload` | Admin |

See the full interactive API docs at **http://localhost:5000/api-docs** when the server is running.

---

## 🗄️ Database Models

| Model | Description |
|---|---|
| `User` | Customers, managers, and admins |
| `Session` | Device sessions per user |
| `RefreshToken` | Hashed refresh tokens (per session) |
| `Product` | Products with slug, price, stock, and category |
| `ProductImage` | Multiple images per product with color tagging |
| `Category` | Product categories with slugs |
| `Cart` / `CartItem` | Per-user cart with color/image selection |
| `Address` | Saved delivery addresses |
| `Order` / `OrderItem` | Orders with snapshotted shipping info |
| `ShippingMethod` | Configurable shipping options with pricing |
| `Notification` | In-app notifications for customers and staff |
| `AuditLog` | Admin/system action audit trail |

---

## 🧪 Running Tests

```bash
cd backend
npm test              # Run all tests
npm run test:coverage # Run with coverage report
```

---

## 🔐 Auth Flow Summary

```
Register / Login
  → Backend sets access_token cookie (15 min)
  → Backend sets refresh_token cookie (7 days)

Protected Request
  → Browser sends access_token cookie automatically
  → Backend verifies token

Access Token Expired
  → Backend returns 401
  → Frontend calls POST /auth/refresh-token
  → Backend validates refresh token, issues new cookies (token rotation)
  → Frontend retries original request

Logout
  → Backend revokes refresh token in DB
  → Backend clears both cookies
```

> For a full beginner-friendly explanation, see [AUTH_SUMMARY_FOR_BEGINNERS.md](./AUTH_SUMMARY_FOR_BEGINNERS.md).

---

## 📜 Scripts

### Backend

```bash
npm run dev          # Start development server (nodemon)
npm start            # Start production server
npm test             # Run tests
npm run test:coverage # Run tests with coverage
npm run swagger      # Regenerate swagger.json
```

### Frontend

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Lint the codebase
```

---

## 📁 Additional Docs

- [BACKEND_SUMMARY.md](./BACKEND_SUMMARY.md) — API reference and data models
- [AUTH_SUMMARY_FOR_BEGINNERS.md](./AUTH_SUMMARY_FOR_BEGINNERS.md) — Plain-English auth system guide

---

## 🗺️ Roadmap

- [x] User authentication with JWT refresh tokens
- [x] Product & category management
- [x] Shopping cart
- [x] Address management
- [x] Order creation & status tracking
- [x] Image uploads (Cloudinary)
- [x] Shipping methods
- [x] Payment integration (Stripe & Paystack)
- [x] Admin dashboard with analytics
- [x] Role-based access control (User / Manager / Admin)
- [x] Audit logging
- [x] In-app notifications
- [ ] Email notifications (order updates, receipts)
- [ ] Product reviews & ratings
- [ ] Discount codes / coupons
- [ ] Wishlist

---

## 📄 License

ISC
