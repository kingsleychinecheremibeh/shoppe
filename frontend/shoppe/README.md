# Shoppe — Frontend

The Next.js 16 storefront and admin dashboard for the Shoppe e-commerce platform.

## Tech Stack

- **Next.js 16** (App Router)
- **TypeScript**
- **Tailwind CSS 4**
- **React Hook Form + Zod** — form handling and validation
- **SWR** — data fetching and caching
- **Recharts** — admin analytics
- **Lucide React** — icons
- **Sonner** — toast notifications
- **Sentry** — error monitoring

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Environment Variables

Create a `.env.local` file in this directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm start        # Start production server
npm run lint     # Run ESLint
```

## Pages

| Route | Description |
|---|---|
| `/` | Home — product listing |
| `/products/:slug` | Product detail |
| `/categories/:slug` | Products by category |
| `/cart` | Shopping cart |
| `/checkout` | Checkout flow |
| `/secure-checkout` | Payment step |
| `/orders` | Order history |
| `/account` | User account |
| `/login` | Login |
| `/register` | Register |
| `/forgot-password` | Password reset |
| `/admin` | Admin dashboard |
| `/faq` | FAQ page |
| `/contact` | Contact page |

## Project Structure

```
app/
├── (pages)/          # Storefront pages
├── admin/            # Admin dashboard
├── components/       # Shared UI components
├── hooks/            # Custom React hooks
lib/                  # API client, utilities
```

## Auth

Authentication uses **HTTP-only cookies** set by the backend. The frontend does **not** store tokens. All API requests must include credentials:

```ts
fetch(url, { credentials: "include" });
```

Token refresh is handled automatically — when a 401 is received, the frontend silently calls `/auth/refresh-token` and retries the original request.

---

For full project documentation, see the [root README](../../README.md).
