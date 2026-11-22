"use client";

import { useEffect, useState, useMemo } from "react";

import { Trash2, Plus, Minus, ArrowRight, ArrowLeft, Lock, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { ConfirmModal } from "@/app/components/feedback";
import { ProductImage } from "@/app/components/product-image";
import { api, getAssetUrl } from "@/lib/api";
import { formatPrice } from "@/lib/format";

type Category = {
  id: string;
  name: string;
  slug: string;
};

type Product = {
  id: string;
  name: string;
  price: number | string;
  image?: string | null;
  stock: number;
  category?: Category;
  images?: { id: string; url: string; color?: string | null; isPrimary: boolean }[];
};

type CartItem = {
  id: string;
  productId: string;
  quantity: number;
  selectedColor?: string | null;
  productImageId?: string | null;
  product: Product;
};

type Cart = {
  id: string;
  items: CartItem[];
};

export default function CartPage() {

  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
  const [clearCartOpen, setClearCartOpen] = useState(false);

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const cartData = await api.getCart();
        setCart((cartData as Cart) || null);
      } catch {
        // Guest users get a 401 — just show empty cart, don't redirect
        setCart(null);
      } finally {
        setLoading(false);
      }
    };
    void fetchCart();
  }, []);

  const handleUpdateQuantity = async (item: CartItem, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveItem(item.id);
      return;
    }

    if (newQuantity > item.product.stock) {
      toast.error(`Only ${item.product.stock} items left in stock.`);
      return;
    }

    try {
      setUpdatingItemId(item.id);
      await api.updateCartItem(item.id, newQuantity);
      
      // Update local state smoothly
      setCart((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          items: prev.items.map((i) => (i.id === item.id ? { ...i, quantity: newQuantity } : i)),
        };
      });
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("cart-updated"));
      }
    } catch {
      toast.error("Failed to update cart quantity.");
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      setUpdatingItemId(itemId);
      await api.removeFromCart(itemId);
      toast.success("Item removed from cart.");
      
      // Update local state smoothly
      setCart((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          items: prev.items.filter((i) => i.id !== itemId),
        };
      });
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("cart-updated"));
      }
    } catch {
      toast.error("Failed to remove item from cart.");
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleClearCart = async () => {
    try {
      setLoading(true);
      await api.clearCart();
      toast.success("Cart cleared successfully.");
      setCart(null);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("cart-updated"));
      }
    } catch {
      toast.error("Failed to clear cart.");
    } finally {
      setLoading(false);
    }
  };

  // Math Calculations
  const subtotal = useMemo(() => {
    if (!cart) return 0;
    return cart.items.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0);
  }, [cart]);


  

  if (loading) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="h-9 w-40 animate-pulse rounded bg-gray-100" />
          <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
            <div className="space-y-6">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="flex gap-4">
                  <div className="h-28 w-24 animate-pulse rounded-xl bg-gray-100" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-4 w-1/2 animate-pulse rounded bg-gray-100" />
                    <div className="h-4 w-1/4 animate-pulse rounded bg-gray-100" />
                  </div>
                </div>
              ))}
            </div>
            <div className="h-56 animate-pulse rounded-2xl bg-gray-100" />
          </div>
        </div>
      </main>
    );
  }

  const hasItems = cart && cart.items.length > 0;
  const itemCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-semibold tracking-tight text-gray-950 sm:text-4xl">Cart</h1>
        {hasItems && (
          <p className="mt-2 text-sm text-gray-500">
            {itemCount} {itemCount === 1 ? "item" : "items"}
          </p>
        )}

        {hasItems ? (
          <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px] lg:items-start">
            {/* Items */}
            <div>
              <ul className="divide-y divide-gray-100 border-y border-gray-100">
                {cart.items.map((item) => {
                  const imgUrl =
                    item.product.images?.find((i) => i.id === item.productImageId)?.url ||
                    item.product.images?.find((i) => i.isPrimary)?.url ||
                    item.product.image;
                  const busy = updatingItemId === item.id;

                  return (
                    <li key={item.id} className={`flex gap-4 py-6 transition sm:gap-6 ${busy ? "pointer-events-none opacity-50" : ""}`}>
                      <Link
                        href={`/products/${item.productId}`}
                        className="relative block h-32 w-24 shrink-0 overflow-hidden rounded-xl bg-canvas sm:h-36 sm:w-28"
                      >
                        {imgUrl ? (
                          <ProductImage
                            src={getAssetUrl(imgUrl) || imgUrl}
                            alt={item.product.name}
                            fill
                            className="object-cover"
                            sizes="112px"
                          />
                        ) : null}
                      </Link>

                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <Link
                              href={`/products/${item.productId}`}
                              className="line-clamp-2 text-sm font-medium text-gray-900 hover:underline hover:underline-offset-4"
                            >
                              {item.product.name}
                            </Link>
                            <p className="mt-1 text-sm text-gray-500">
                              {[item.product.category?.name, item.selectedColor].filter(Boolean).join(" · ")}
                            </p>
                            <p className="mt-1 text-sm text-gray-500">{formatPrice(item.product.price)} each</p>
                          </div>
                          <p className="shrink-0 text-sm font-semibold text-gray-950">
                            {formatPrice(Number(item.product.price) * item.quantity)}
                          </p>
                        </div>

                        <div className="mt-auto flex items-center justify-between gap-4 pt-4">
                          <div className="inline-flex h-10 items-center rounded-full border border-gray-200">
                            <button
                              type="button"
                              onClick={() => handleUpdateQuantity(item, item.quantity - 1)}
                              aria-label={`Decrease quantity of ${item.product.name}`}
                              className="flex h-10 w-10 items-center justify-center rounded-l-full text-gray-600 transition hover:text-gray-950"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="w-6 select-none text-center text-sm font-medium text-gray-950" aria-live="polite">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateQuantity(item, item.quantity + 1)}
                              disabled={item.quantity >= item.product.stock}
                              aria-label={`Increase quantity of ${item.product.name}`}
                              className="flex h-10 w-10 items-center justify-center rounded-r-full text-gray-600 transition hover:text-gray-950 disabled:opacity-30"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="inline-flex items-center gap-1.5 text-sm text-gray-500 transition hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                            Remove
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-6 flex items-center justify-between">
                <Link
                  href="/products"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 transition hover:text-gray-950"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Continue shopping
                </Link>
                <button
                  type="button"
                  onClick={() => setClearCartOpen(true)}
                  className="text-sm text-gray-500 underline-offset-4 transition hover:text-red-600 hover:underline"
                >
                  Empty cart
                </button>
              </div>
            </div>

            {/* Summary */}
            <aside className="rounded-2xl bg-canvas p-6 lg:sticky lg:top-24">
              <h2 className="text-base font-semibold text-gray-950">Order summary</h2>
              <dl className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-600">Subtotal</dt>
                  <dd className="font-medium text-gray-950">{formatPrice(subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Shipping</dt>
                  <dd className="text-gray-500">Calculated at checkout</dd>
                </div>
              </dl>
              <div className="mt-5 flex items-baseline justify-between border-t border-gray-200 pt-5">
                <span className="text-sm font-medium text-gray-950">Total so far</span>
                <span className="text-xl font-semibold text-gray-950">{formatPrice(subtotal)}</span>
              </div>

              <Link
                href="/checkout"
                className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand text-sm font-medium text-white transition hover:bg-brand-hover"
              >
                Checkout
                <ArrowRight className="h-4 w-4" />
              </Link>

              <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-gray-500">
                <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                Secure payment through Paystack
              </p>
            </aside>
          </div>
        ) : (
          <div className="mt-8 flex flex-col items-center rounded-3xl bg-canvas px-6 py-20 text-center">
            <ShoppingBag className="h-10 w-10 text-gray-300" aria-hidden="true" />
            <h2 className="mt-4 text-lg font-semibold text-gray-950">Your cart is empty</h2>
            <p className="mt-1 max-w-sm text-sm text-gray-500">
              Have a look around. When you find something you like, add it here.
            </p>
            <Link
              href="/products"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-medium text-white transition hover:bg-brand-hover"
            >
              Start shopping
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
      <ConfirmModal
        open={clearCartOpen}
        title="Empty cart?"
        message="This will remove every item from your cart."
        confirmLabel="Empty cart"
        loading={loading}
        onClose={() => setClearCartOpen(false)}
        onConfirm={() => {
          setClearCartOpen(false);
          void handleClearCart();
        }}
      />
    </main>
  );
}
