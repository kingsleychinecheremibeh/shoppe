# Auth Summary, Explained Simply

This file explains what we changed in authentication and why it matters.

Think of the app like a shop with a door guard.

When a user logs in, the backend gives the browser two special passes:

- `access_token`
- `refresh_token`

These passes are stored in cookies.

## What Is A Cookie?

A cookie is a small thing the browser keeps for a website.

When the browser talks to the backend, it can automatically send the cookie along.

So instead of React holding the login token and sending it manually, the browser does it for us.

## Why We Use HTTP-Only Cookies

Our cookies are `httpOnly`.

That means normal frontend JavaScript cannot read them.

This is safer than storing tokens in `localStorage`.

Old way:

```txt
React stores token
React sends Authorization header
Bad JavaScript might steal token
```

New way:

```txt
Browser stores cookie
Browser sends cookie automatically
React cannot read the secret token
```

## The Two Tokens

### Access Token

The `access_token` is the short pass.

It lasts 15 minutes.

The backend uses it to check if the user is allowed to do things like:

- view their cart
- place an order
- view their addresses
- view their profile

If the access token is valid, the backend says:

```txt
Yes, this user is logged in.
```

If it is expired, the backend says:

```txt
401 Unauthorized
```

### Refresh Token

The `refresh_token` is the longer pass.

It lasts 7 days.

Its only job is to get a new access token when the access token expires.

So the user does not have to log in again every 15 minutes.

## What Happens When The User Logs In?

The user sends email and password to:

```txt
POST /api/v1/auth/login
```

If the login is correct, the backend:

1. Creates an `access_token`.
2. Creates a `refresh_token`.
3. Stores the refresh token safely in the database as a hash.
4. Sends both tokens to the browser as HTTP-only cookies.
5. Sends the user information back to the frontend.

The frontend does not receive the token in JSON anymore.

It only receives something like:

```json
{
  "user": {
    "id": "...",
    "name": "...",
    "email": "...",
    "role": "USER"
  }
}
```

## What Is A Hash?

A hash is like turning a secret into a scrambled version.

The database does not store the raw refresh token.

It stores a hashed version.

That way, if someone looked inside the database, they would not see the real refresh token.

## What Happens When The Access Token Expires?

After 15 minutes, the access token expires.

Then a protected request might fail with:

```txt
401 Unauthorized
```

When the frontend sees that, it should call:

```txt
POST /api/v1/auth/refresh-token
```

The browser sends the `refresh_token` cookie automatically.

The backend checks:

1. Is the refresh token real?
2. Is it expired?
3. Is it still in the database?
4. Has it already been revoked?
5. Does the user still exist?

If everything is okay, the backend gives the browser:

- a new `access_token`
- a new `refresh_token`

Then the frontend retries the request that failed.

## What Is Refresh Token Rotation?

Rotation means:

```txt
Use old refresh token once
Throw old refresh token away
Create a new refresh token
```

This is safer.

If someone somehow steals an old refresh token, it becomes useless after it has been used.

## What Happens On Logout?

The frontend calls:

```txt
POST /api/v1/auth/logout
```

The backend:

1. Revokes the refresh token in the database.
2. Clears the `access_token` cookie.
3. Clears the `refresh_token` cookie.

After that, the user is logged out.

## Backend Files We Changed

### `backend/src/utils/authCookie.js`

This file keeps the cookie settings in one place.

It defines:

- cookie names
- how long cookies last
- `httpOnly`
- `secure`
- `sameSite`

The access cookie lasts 15 minutes.

The refresh cookie lasts 7 days.

### `backend/src/services/authService.js`

This is where the main auth logic lives.

It:

- creates access tokens
- creates refresh tokens
- hashes refresh tokens
- stores refresh tokens in the database
- refreshes expired sessions
- revokes refresh tokens on logout

### `backend/src/controllers/authController.js`

This connects HTTP requests to the auth service.

It handles:

- register
- login
- refresh token
- logout
- current user

It also sets and clears cookies.

### `backend/src/middleware/authMiddleware.js`

This protects private routes.

Before, it checked:

```txt
Authorization: Bearer token
```

Now it checks:

```txt
access_token cookie
```

### `backend/src/routes/authRoutes.js`

This defines the auth endpoints:

```txt
POST /auth/register
POST /auth/login
POST /auth/refresh-token
POST /auth/logout
GET  /auth/me
```

### `backend/src/repositories/refreshTokenRepository.js`

This talks to the database for refresh tokens.

It can:

- create a refresh token record
- find a valid refresh token
- revoke a refresh token
- revoke all refresh tokens for a user

### `backend/prisma/schema.prisma`

We added a `RefreshToken` model.

This creates a database table for refresh tokens.

## Frontend Change

The frontend should stop doing this:

```txt
Save token in localStorage
Send Authorization header
```

Instead, every request should include cookies:

```ts
credentials: "include"
```

So the fetch helper should send requests like this:

```ts
fetch(url, {
  credentials: "include",
});
```

This lets the browser send `access_token` and `refresh_token` cookies automatically.

## The Simple Story

Here is the whole thing like a story:

```txt
User logs in.
Backend gives browser two secret cookies.
Short cookie proves the user is logged in.
Long cookie helps get a new short cookie.
Frontend does not touch the secret cookies.
Browser sends cookies automatically.
If short cookie expires, frontend asks backend to refresh.
Backend checks long cookie.
Backend gives fresh cookies.
User continues using the shop.
When user logs out, backend cancels the long cookie and clears both cookies.
```

## Why This Is Good For Ecommerce

This setup is good because:

- users do not get logged out every 15 minutes
- tokens are not stored in frontend JavaScript
- refresh tokens can be revoked
- refresh tokens are hashed in the database
- checkout and orders can be protected more safely

When we add payments, we should still not handle card details ourselves.

Payment details should be handled by a provider like:

- Stripe
- Paystack
- Flutterwave

Our backend should only create and verify payment sessions.

## Important Environment Variables

The backend needs:

```env
JWT_SECRET=your_access_token_secret
JWT_REFRESH_SECRET=your_refresh_token_secret
```

These should be long random strings.

They should not be shared.

They should not be committed to Git.

## Current Auth Flow

```txt
Register/Login
  -> backend sets access_token cookie
  -> backend sets refresh_token cookie

Protected request
  -> browser sends access_token
  -> backend verifies it

Access token expired
  -> backend returns 401
  -> frontend calls /auth/refresh-token
  -> backend checks refresh_token
  -> backend sends new cookies
  -> frontend retries original request

Logout
  -> backend revokes refresh token
  -> backend clears both cookies
```

That is the auth system.
