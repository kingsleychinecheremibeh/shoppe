<div align="center">

# 🛍️ Shoppe

**A full-stack e-commerce platform built for production.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-shoppe--flame--chi.vercel.app-black?style=for-the-badge&logo=vercel)](https://shoppe-flame-chi.vercel.app/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Express%205-green?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Prisma%207-blue?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)

</div>

---

## 📸 Screenshots

### Homepage
![Shoppe Homepage](./docs/screenshots/homepage.png)

### Product Catalogue
![Products Page](./docs/screenshots/products.png)

### Checkout
![Checkout Page](./docs/screenshots/checkout.png)

### Admin Dashboard
![Admin Dashboard](./docs/screenshots/admin-dashboard.png)

---

## 📖 Overview

**Shoppe** is a production-ready e-commerce platform built with the **PERN stack** (PostgreSQL, Express, React/Next.js, Node.js). It covers the full commerce lifecycle — product discovery, cart management, multi-step checkout, order tracking, payment processing, and a full-featured admin dashboard with analytics and role-based access control.

> 🔗 **Live:** [shoppe-flame-chi.vercel.app](https://shoppe-flame-chi.vercel.app/)

---

## ✨ Feature Highlights

### 🛒 Storefront
- Editorial product listing with category filtering
- Product detail pages with multi-image gallery and colour variant selection
- Persistent shopping cart (colour + image variant aware)
- Multi-step checkout — address selection → shipping method → payment
- Real-time order tracking with status history
- In-app notification centre
- PWA support — installable on mobile
- Sentry error monitoring

### 🔐 Authentication & Security
- **Dual-token JWT** — short-lived access tokens (15 min) + long-lived refresh tokens (7 days)
- Tokens stored as **HTTP-only cookies** — never exposed to JavaScript
- **Refresh token rotation** — each refresh invalidates the previous token
- Refresh tokens **hashed with bcrypt** in the database
- **Session tracking** per device (IP, user agent)
- CSRF protection, Helmet security headers, and rate limiting on all endpoints

### 🖥️ Admin Dashboard
- Revenue, orders, users, and products KPI cards
- Revenue-over-time line chart (Recharts)
- Full product management — CRUD, Cloudinary image uploads, colour variants
- Category management
- Order management with enforced status transitions
- Shipping method configuration
- Manager accounts with **granular permissions** (orders / products / shipping / analytics)
- Audit log for all admin actions

### 💳 Payments
- **Stripe** integration
- **Paystack** integration
- Idempotency keys to prevent duplicate charges

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Client (Browser)                    │
│              Next.js 16 App Router + TypeScript          │
│         Tailwind CSS · SWR · React Hook Form · Zod      │
└──────────────────────────┬──────────────────────────────┘
                           │  HTTPS · HTTP-only Cookies
                           │
┌──────────────────────────▼──────────────────────────────┐
│                   Express 5 REST API                     │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  │
│  │  Routes  │→ │Validators│→ │Controllers│→│Services│  │
│  └──────────┘  └──────────┘  └──────────┘  └───┬────┘  │
│                                                 │        │
│  ┌──────────────────┐    ┌──────────────────┐   │        │
│  │  Auth Middleware  │    │  Repositories    │←──┘        │
│  │  (JWT · Cookies) │    │  (Prisma ORM)    │            │
│  └──────────────────┘    └────────┬─────────┘            │
│                                   │                      │
│  ┌────────────┐    ┌──────────────▼──────────────────┐  │
│  │   Redis    │    │         PostgreSQL               │  │
│  │  (Cache)   │    │   (Users · Products · Orders)    │  │
│  └────────────┘    └─────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
         │                          │
   ┌─────▼──────┐           ┌──────▼──────┐
   │ Cloudinary │           │ Stripe /    │
   │ (Images)   │           │ Paystack    │
   └────────────┘           └─────────────┘
```

---

## 🗂️ Project Structure

```
shoppe/
├── backend/                        # Express API
│   ├── src/
│   │   ├── controllers/            # HTTP request handlers
│   │   ├── services/               # Business logic layer
│   │   ├── repositories/           # Database access (Prisma)
│   │   ├── middleware/             # Auth, error, rate limiting
│   │   ├── routes/                 # Route definitions
│   │   ├── validators/             # Zod request schemas
│   │   ├── utils/                  # JWT, cookies, helpers
│   │   └── config/                 # App & env configuration
│   ├── prisma/
│   │   ├── schema.prisma           # Database schema
│   │   └── migrations/             # Migration history
│   ├── __tests__/                  # Jest + Supertest suites
│   ├── swagger.json                # Auto-generated API docs
│   └── .env.example
│
├── frontend/
│   └── shoppe/                     # Next.js application
│       ├── app/
│       │   ├── page.tsx            # Homepage
│       │   ├── products/           # Product listing & detail
│       │   ├── cart/               # Shopping cart
│       │   ├── checkout/           # Checkout flow
│       │   ├── secure-checkout/    # Payment step
│       │   ├── orders/             # Order history
│       │   ├── account/            # User account
│       │   ├── admin/              # Admin dashboard
│       │   │   ├── page.tsx        # Analytics overview
│       │   │   ├── products/       # Product management
│       │   │   ├── categories/     # Category management
│       │   │   ├── orders/         # Order management
│       │   │   ├── shipping/       # Shipping methods
│       │   │   └── managers/       # Manager accounts
│       │   ├── auth/               # Login & register
│       │   └── components/         # Shared UI components
│       └── lib/                    # API client, utilities
│
└── docs/
    └── screenshots/                # App screenshots
```

---

## 🗄️ Data Models

```
User ──────────┬── Session ─── RefreshToken
               ├── Address
               ├── Cart ─────── CartItem ─── Product ─── ProductImage
               ├── Order ────── OrderItem         │
               │                └── ShippingMethod│
               └── Notification             Category
                                                  │
                                            AuditLog
```

| Model | Key Fields |
|---|---|
| `User` | id, email, name, role (`USER\|MANAGER\|ADMIN`), managerPermissions[] |
| `Session` | id, userId, userAgent, ip, lastSeenAt |
| `RefreshToken` | id, sessionId, tokenHash, expiresAt, revokedAt |
| `Product` | id, name, slug, price, stock, categoryId |
| `ProductImage` | id, productId, url, color, isPrimary, sortOrder |
| `Order` | id, userId, status, subtotal, shippingFee, total, paymentGateway |
| `ShippingMethod` | id, name, price, estimatedDays, isActive |
| `Notification` | id, userId, audience, type, title, message, readAt |
| `AuditLog` | id, userId, action, entity, entityId, metadata |

---

## 📡 API Reference

**Base URL:** `https://your-api.com/api/v1`

> Full interactive docs available at `/api-docs` (Swagger UI)

### Auth
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/auth/register` | Create account | — |
| `POST` | `/auth/login` | Login, receive cookies | — |
| `POST` | `/auth/refresh-token` | Rotate refresh token | Cookie |
| `POST` | `/auth/logout` | Revoke tokens | Cookie |
| `GET` | `/auth/me` | Get current user | Cookie |

### Products
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/products` | List all products | — |
| `GET` | `/products/:id` | Get product by ID | — |
| `POST` | `/products` | Create product | Admin |
| `PUT` | `/products/:id` | Update product | Admin |
| `DELETE` | `/products/:id` | Delete product | Admin |

### Orders
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/orders` | Place order from cart | User |
| `GET` | `/orders/my-orders` | My order history | User |
| `GET` | `/orders/:id` | Order details | User/Admin |
| `PUT` | `/orders/:id/status` | Update order status | Admin |
| `GET` | `/orders` | All orders | Admin |

> See [BACKEND_SUMMARY.md](./BACKEND_SUMMARY.md) for the full endpoint reference.

### Order Status Flow
```
PENDING ──→ PAID ──→ SHIPPED ──→ DELIVERED
   └──────────────────────────→ CANCELLED
```

---

## 🔐 Auth Flow

```
┌─────────┐     POST /auth/login      ┌─────────┐
│ Browser │ ─────────────────────────▶│   API   │
│         │◀─── Set-Cookie: ──────────│         │
│         │     access_token (15min)  │         │
│         │     refresh_token (7days) └─────────┘
│         │
│         │     GET /protected        ┌─────────┐
│         │ ──── Cookie: ────────────▶│   API   │
│         │      access_token         │ Verify  │
│         │◀── 200 OK ────────────────│   JWT   │
│         │                           └─────────┘
│         │
│         │   [access_token expires]
│         │
│         │   POST /auth/refresh-token ┌────────┐
│         │ ──── Cookie: ─────────────▶│  API   │
│         │      refresh_token         │ Rotate │
│         │◀─── New cookies ───────────│ Token  │
└─────────┘                           └────────┘
```

> 📖 See [AUTH_SUMMARY_FOR_BEGINNERS.md](./AUTH_SUMMARY_FOR_BEGINNERS.md) for a plain-English walkthrough.

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Redis
- Cloudinary account
- Stripe or Paystack account

### 1. Clone

```bash
git clone https://github.com/kingsleychinecheremibeh/shoppe.git
cd shoppe
```

### 2. Backend

```bash
cd backend
cp .env.example .env   # Fill in your values
npm install
npx prisma migrate deploy
npx prisma generate
npm run dev            # http://localhost:5000
```

### 3. Frontend

```bash
cd frontend/shoppe
npm install
npm run dev            # http://localhost:3000
```

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/shoppe

# Auth
JWT_SECRET=your_long_random_access_token_secret
JWT_REFRESH_SECRET=your_long_random_refresh_token_secret

# Redis
REDIS_URL=redis://localhost:6379
CACHE_TTL_SECONDS=300

# CORS
FRONTEND_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000
COOKIE_SAMESITE=lax
COOKIE_DOMAIN=

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Payments
STRIPE_ENABLED=false
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
PAYSTACK_SECRET_KEY=sk_test_...
```

### Frontend (`frontend/shoppe/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

---

## 🧪 Testing

```bash
cd backend
npm test                # Run all tests (Jest + Supertest)
npm run test:coverage   # With coverage report
```

---

## 📦 Tech Stack

### Backend
| | Technology | Purpose |
|---|---|---|
| ⚡ | Express 5 | REST API framework |
| 🗃️ | PostgreSQL + Prisma 7 | Database & ORM |
| 🔴 | Redis | Caching |
| 🔑 | JWT + bcryptjs | Auth & password hashing |
| ☁️ | Cloudinary | Image storage |
| 💳 | Stripe + Paystack | Payments |
| ✅ | Zod | Request validation |
| 🛡️ | Helmet + express-rate-limit | Security |
| 📋 | Winston + Pino | Logging |
| 📖 | Swagger UI | API documentation |
| 🧪 | Jest + Supertest | Testing |

### Frontend
| | Technology | Purpose |
|---|---|---|
| ⚛️ | Next.js 16 (App Router) | React framework |
| 🔷 | TypeScript 5 | Type safety |
| 🎨 | Tailwind CSS 4 | Styling |
| 📝 | React Hook Form + Zod | Forms & validation |
| 🔄 | SWR | Data fetching & caching |
| 📊 | Recharts | Admin analytics charts |
| 🔔 | Sonner | Toast notifications |
| 🚨 | Sentry | Error monitoring |
| 📱 | next-pwa | Progressive Web App |

---

## 🗺️ Roadmap

- [x] JWT authentication with refresh token rotation
- [x] HTTP-only cookie auth (XSS-safe)
- [x] Product & category management
- [x] Multi-image product gallery with colour variants
- [x] Shopping cart with variant awareness
- [x] Address management
- [x] Multi-step checkout
- [x] Shipping method configuration
- [x] Payment integration (Stripe & Paystack)
- [x] Order tracking with status transitions
- [x] Admin dashboard with revenue analytics
- [x] Role-based access control (User / Manager / Admin)
- [x] Granular manager permissions
- [x] Audit logging
- [x] In-app notifications
- [x] PWA support
- [x] Sentry error monitoring
- [ ] Email notifications (order updates, receipts)
- [ ] Product reviews & ratings
- [ ] Discount codes & coupons
- [ ] Wishlist
- [ ] Inventory alerts

---

## 📄 Additional Docs

| Document | Description |
|---|---|
| [BACKEND_SUMMARY.md](./BACKEND_SUMMARY.md) | Full API reference and data models |
| [AUTH_SUMMARY_FOR_BEGINNERS.md](./AUTH_SUMMARY_FOR_BEGINNERS.md) | Plain-English auth system guide |
| `/api-docs` | Live Swagger UI (when server is running) |

---

## 📄 License

ISC © [Kingsley Chinecherem Ibeh](https://github.com/kingsleychinecheremibeh)
