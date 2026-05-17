# ECOMMERCE BACKEND SUMMARY

## **API BASE URL**
```
http://localhost:5000/api
```

---

## **AUTHENTICATION**

### Register
- **POST** `/auth/register`
- **Body:** `{ name, email, password }`
- **Response:** `{ user: { id, name, email, role }, token }`

### Login
- **POST** `/auth/login`
- **Body:** `{ email, password }`
- **Response:** `{ user: { id, name, email, role }, token }`

### Get Current User
- **GET** `/auth/me`
- **Auth:** Required (Bearer token)
- **Response:** `{ user: { id, name, email, role } }`

---

## **PRODUCTS**

### Get All Products
- **GET** `/products`
- **Response:** Array of `{ id, name, slug, description, price, image, stock, category }`

### Get Product by ID
- **GET** `/products/:id`
- **Response:** Single product with category details

### Create Product (ADMIN ONLY)
- **POST** `/products`
- **Auth:** Required + Admin
- **Body:** `{ name, description, price, stock, categoryId, image }`
- **Response:** Created product

### Update Product (ADMIN ONLY)
- **PUT** `/products/:id`
- **Auth:** Required + Admin
- **Body:** `{ name, description, price, stock }`

### Delete Product (ADMIN ONLY)
- **DELETE** `/products/:id`
- **Auth:** Required + Admin

---

## **CATEGORIES**

### Get All Categories
- **GET** `/categories`
- **Response:** Array of `{ id, name, slug }`

### Create Category (ADMIN ONLY)
- **POST** `/categories`
- **Auth:** Required + Admin
- **Body:** `{ name }`

### Update Category (ADMIN ONLY)
- **PUT** `/categories/:id`
- **Auth:** Required + Admin
- **Body:** `{ name }`

### Delete Category (ADMIN ONLY)
- **DELETE** `/categories/:id`
- **Auth:** Required + Admin

---

## **CART**

### Get My Cart
- **GET** `/cart`
- **Auth:** Required
- **Response:** `{ id, userId, items: [{ id, productId, quantity, product }] }`

### Add Item to Cart
- **POST** `/cart`
- **Auth:** Required
- **Body:** `{ productId, quantity }`
- **Response:** Updated cart with new item

### Update Cart Item
- **PUT** `/cart/:itemId`
- **Auth:** Required
- **Body:** `{ quantity }`
- **Response:** Updated cart

### Remove Cart Item
- **DELETE** `/cart/:itemId`
- **Auth:** Required

### Clear Cart
- **DELETE** `/cart`
- **Auth:** Required

---

## **ADDRESSES**

### Get My Addresses
- **GET** `/addresses`
- **Auth:** Required
- **Response:** Array of `{ id, fullName, phone, street, city, state, country }`

### Create Address
- **POST** `/addresses`
- **Auth:** Required
- **Body:** `{ fullName, phone, street, city, state, country }`

### Update Address
- **PUT** `/addresses/:id`
- **Auth:** Required
- **Body:** Same as create

### Delete Address
- **DELETE** `/addresses/:id`
- **Auth:** Required

---

## **ORDERS**

### Get My Orders
- **GET** `/orders/my-orders`
- **Auth:** Required
- **Response:** Array of orders sorted by newest first

### Get All Orders (ADMIN ONLY)
- **GET** `/orders`
- **Auth:** Required + Admin

### Get Order by ID
- **GET** `/orders/:id`
- **Auth:** Required (owner or admin)
- **Response:** Order with items, address, and user details

### Create Order
- **POST** `/orders`
- **Auth:** Required
- **Body:** `{ addressId }`
- **Response:** Created order with items and total

**Order Flow:**
1. User has items in cart
2. User selects delivery address
3. Create order → Cart is cleared, inventory updated, order created

### Update Order Status (ADMIN ONLY)
- **PUT** `/orders/:id/status`
- **Auth:** Required + Admin
- **Body:** `{ status }`
- **Allowed Transitions:**
  - `PENDING` → `PAID` or `CANCELLED`
  - `PAID` → `SHIPPED` or `CANCELLED`
  - `SHIPPED` → `DELIVERED`
  - `DELIVERED` → (final)
  - `CANCELLED` → (final)

### Delete Order (ADMIN ONLY)
- **DELETE** `/orders/:id`
- **Auth:** Required + Admin

---

## **AUTHENTICATION HEADER**
All protected endpoints require:
```
Authorization: Bearer {token}
```

---

## **DATA MODELS**

### User
```javascript
{
  id: UUID,
  name: String,
  email: String (unique),
  password: String (hashed),
  role: "USER" | "ADMIN",
  createdAt: DateTime,
  updatedAt: DateTime
}
```

### Product
```javascript
{
  id: UUID,
  name: String,
  slug: String (unique),
  description: String,
  price: Number,
  image: URL,
  stock: Number,
  categoryId: UUID,
  createdAt: DateTime,
  updatedAt: DateTime
}
```

### Category
```javascript
{
  id: UUID,
  name: String,
  slug: String (unique),
  createdAt: DateTime,
  updatedAt: DateTime
}
```

### Cart
```javascript
{
  id: UUID,
  userId: UUID,
  items: CartItem[],
  createdAt: DateTime,
  updatedAt: DateTime
}
```

### CartItem
```javascript
{
  id: UUID,
  cartId: UUID,
  productId: UUID,
  quantity: Number,
  product: Product
}
```

### Address
```javascript
{
  id: UUID,
  userId: UUID,
  fullName: String,
  phone: String,
  street: String,
  city: String,
  state: String,
  country: String,
  createdAt: DateTime,
  updatedAt: DateTime
}
```

### Order
```javascript
{
  id: UUID,
  userId: UUID,
  addressId: UUID,
  total: Number,
  status: "PENDING" | "PAID" | "SHIPPED" | "DELIVERED" | "CANCELLED",
  orderItems: OrderItem[],
  address: Address,
  user: User,
  createdAt: DateTime,
  updatedAt: DateTime
}
```

### OrderItem
```javascript
{
  id: UUID,
  orderId: UUID,
  productId: UUID,
  quantity: Number,
  price: Number,
  product: Product
}
```

---

## **FEATURES IMPLEMENTED**

✅ User authentication & authorization  
✅ Product management (CRUD)  
✅ Category management (CRUD)  
✅ Shopping cart functionality  
✅ Address management  
✅ Order creation & management  
✅ Order status tracking  
✅ Inventory management (stock deduction on order)  
✅ Admin controls  
✅ JWT token authentication  
✅ Password hashing (bcrypt)  
✅ CORS & security headers  
✅ Rate limiting  
✅ Image uploads to S3  
✅ PostgreSQL database  

---

## **FEATURES TO ADD LATER** 🚧

⏳ **Payment Processing** (Stripe/Razorpay)
- POST `/orders/:id/payment` - Initiate payment
- POST `/orders/:id/payment/confirm` - Confirm payment
- Webhook handling for payment status updates
- Order status auto-update on successful payment

---

## **ERROR HANDLING**

All endpoints return appropriate HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad request (validation error)
- `401` - Unauthorized (missing token)
- `403` - Forbidden (access denied)
- `404` - Not found
- `500` - Server error

Error response format:
```javascript
{
  message: "Error description"
}
```

---

## **WHAT FRONTEND NEEDS TO BUILD**

### Pages
1. **Home** - Product listing with search/filter by category
2. **Product Detail** - Product info with add to cart
3. **Cart** - View cart items, update qty, remove items
4. **Checkout** - Address selection/creation, order review, place order
5. **User Account** - View/edit profile
6. **Orders** - View order history and details
7. **Admin Dashboard** (if admin role)
   - Product management
   - Category management
   - Order management
   - Order status updates

### Key Flows
1. Register/Login
2. Browse products by category
3. Add to cart
4. Checkout (address + order)
5. View order status
6. Payments

---

## **HOSTING & SETUP**

**Backend runs on:**
```bash
npm run dev    # Development
npm start      # Production
```

**Environment variables needed:**
```
DATABASE_URL=postgresql://user:password@host:port/dbname
JWT_SECRET=your_secret_key
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_S3_BUCKET=your_bucket_name
```

---

**Ready for frontend prototype in Figma! 🎨**
