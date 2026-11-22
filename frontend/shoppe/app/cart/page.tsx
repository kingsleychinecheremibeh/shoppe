"use client";

import { useEffect, useState, useMemo } from "react";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft02Icon,
  ArrowRight02Icon,
  Delete02Icon,
  Image01Icon,
  LockIcon,
  MinusSignIcon,
  PlusSignIcon,
  ShoppingCart01Icon,
} from "@hugeicons/core-free-icons";
import Link from "next/link";
import { toast } from "sonner";
import { ConfirmModal } from "@/app/components/feedback";
import { ProductImage } from "@/app/components/product-image";
import { api, getAssetUrl } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { notifyCartUpdated } from "@/lib/cart-events";
import { getCategoryTheme } from "@/lib/category-colors";

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
      notifyCartUpdated();
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
      notifyCartUpdated();
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
      notifyCartUpdated();
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
      <main className="min-h-screen">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="h-14 w-40 animate-pulse rounded-md bg-canvas" />
          <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px]">
            <div className="space-y-4">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-40 animate-pulse rounded-lg border-[1.5px] border-gray-300 bg-canvas" />
              ))}
            </div>
            <div className="h-64 animate-pulse rounded-lg border-[1.5px] border-gray-300 bg-canvas" />
          </div>
        </div>
      </main>
    );
  }

  const hasItems = cart && cart.items.length > 0;
  const itemCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex items-end gap-4">
          <h1 className="text-6xl leading-none font-extrabold tracking-[-0.045em] text-ink">Cart</h1>
          {hasItems && (
            <span className="mb-1.5 rounded-md border-[1.5px] border-ink bg-sun px-2.5 py-1 font-mono text-sm font-semibold">
              {itemCount} {itemCount === 1 ? "item" : "items"}
            </span>
          )}
        </div>

        {hasItems ? (
          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
            <div>
              <ul className="flex flex-col gap-4">
                {cart.items.map((item) => {
                  const imgUrl =
                    item.product.images?.find((i) => i.id === item.productImageId)?.url ||
                    item.product.images?.find((i) => i.isPrimary)?.url ||
                    item.product.image;
                  const busy = updatingItemId === item.id;
                  const theme = getCategoryTheme(item.product.category);

                  return (
                    <li
                      key={item.id}
                      className={`flex gap-4 rounded-lg border-[1.5px] border-ink bg-white p-3 transition sm:gap-5 sm:p-4 ${busy ? "pointer-events-none opacity-50" : ""}`}
                    >
                      <Link
                        href={`/products/${item.productId}`}
                        className="relative block h-32 w-24 shrink-0 overflow-hidden rounded-md border-[1.5px] border-ink sm:h-36 sm:w-28"
                        style={{ background: theme.soft }}
                      >
                        {imgUrl ? (
                          <ProductImage
                            src={getAssetUrl(imgUrl) || imgUrl}
                            alt={item.product.name}
                            fill
                            className="object-cover mix-blend-multiply"
                            sizes="112px"
                          />
                        ) : (
                          <span className="flex h-full items-center justify-center text-gray-500">
                            <HugeiconsIcon icon={Image01Icon} size={32} />
                          </span>
                        )}
                      </Link>

                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <Link
                              href={`/products/${item.productId}`}
                              className="line-clamp-2 text-base font-semibold text-ink underline-offset-4 hover:underline"
                            >
                              {item.product.name}
                            </Link>
                            <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-gray-600">
                              {item.product.category?.name && (
                                <span className="inline-flex items-center gap-1.5">
                                  <span className="h-2.5 w-2.5 rounded-[3px] border border-ink" style={{ background: theme.solid }} aria-hidden="true" />
                                  {item.product.category.name}
                                </span>
                              )}
                              {item.selectedColor && <span className="capitalize">· {item.selectedColor}</span>}
                            </p>
                            <p className="mt-1 font-mono text-sm text-gray-600">{formatPrice(item.product.price)} each</p>
                          </div>
                          <p className="price-tag shrink-0 text-lg text-ink">{formatPrice(Number(item.product.price) * item.quantity)}</p>
                        </div>

                        <div className="mt-auto flex items-center justify-between gap-4 pt-4">
                          <div className="inline-flex items-center rounded-lg border-[1.5px] border-ink">
                            <button
                              type="button"
                              onClick={() => handleUpdateQuantity(item, item.quantity - 1)}
                              aria-label={`Decrease quantity of ${item.product.name}`}
                              className="flex h-11 w-11 items-center justify-center"
                            >
                              <HugeiconsIcon icon={MinusSignIcon} size={20} strokeWidth={1.8} />
                            </button>
                            <span className="w-8 text-center font-mono font-semibold select-none" aria-live="polite">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateQuantity(item, item.quantity + 1)}
                              disabled={item.quantity >= item.product.stock}
                              aria-label={`Increase quantity of ${item.product.name}`}
                              className="flex h-11 w-11 items-center justify-center disabled:opacity-30"
                            >
                              <HugeiconsIcon icon={PlusSignIcon} size={20} strokeWidth={1.8} />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            aria-label={`Remove ${item.product.name}`}
                            className="inline-flex h-11 min-w-11 items-center justify-center gap-1.5 rounded-lg px-2 text-[15px] font-medium text-gray-700 transition hover:bg-red-50 hover:text-danger sm:px-3"
                          >
                            <HugeiconsIcon icon={Delete02Icon} size={22} strokeWidth={1.6} />
                            <span className="hidden sm:inline" aria-hidden="true">Remove</span>
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-6 flex items-center justify-between">
                <Link href="/products" className="inline-flex items-center gap-2 text-[15px] font-semibold underline-offset-4 hover:underline">
                  <HugeiconsIcon icon={ArrowLeft02Icon} size={22} strokeWidth={1.8} />
                  Continue shopping
                </Link>
                <button
                  type="button"
                  onClick={() => setClearCartOpen(true)}
                  className="text-[15px] text-gray-600 underline-offset-4 transition hover:text-danger hover:underline"
                >
                  Empty cart
                </button>
              </div>
            </div>

            <aside className="rounded-lg border-[1.5px] border-ink bg-white p-6 shadow-sticker lg:sticky lg:top-32">
              <h2 className="text-2xl font-extrabold text-ink">Order summary</h2>
              <dl className="mt-5 space-y-3 text-[15px]">
                <div className="flex justify-between">
                  <dt className="text-gray-700">Subtotal</dt>
                  <dd className="font-mono font-semibold text-ink">{formatPrice(subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-700">Delivery</dt>
                  <dd className="text-gray-600">Chosen at checkout</dd>
                </div>
              </dl>
              <div className="mt-5 flex items-baseline justify-between border-t-[1.5px] border-ink pt-5">
                <span className="text-base font-semibold text-ink">Total so far</span>
                <span className="price-tag text-2xl text-ink">{formatPrice(subtotal)}</span>
              </div>

              <Link
                href="/checkout"
                className="mt-6 inline-flex h-14 w-full items-center justify-center gap-2.5 rounded-lg bg-ink text-base font-semibold text-paper transition hover:bg-black"
              >
                Checkout
                <HugeiconsIcon icon={ArrowRight02Icon} size={24} strokeWidth={1.8} />
              </Link>

              <p className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-600">
                <HugeiconsIcon icon={LockIcon} size={20} strokeWidth={1.6} aria-hidden="true" />
                Secure payment through Paystack
              </p>
            </aside>
          </div>
        ) : (
          <div className="mt-8 flex flex-col items-center rounded-lg border-[1.5px] border-dashed border-ink px-6 py-20 text-center">
            <span className="flex h-24 w-24 items-center justify-center rounded-lg border-[1.5px] border-ink bg-pink">
              <HugeiconsIcon icon={ShoppingCart01Icon} size={52} strokeWidth={1.4} aria-hidden="true" />
            </span>
            <h2 className="mt-5 text-3xl font-extrabold text-ink">Your cart&apos;s empty</h2>
            <p className="mt-2 max-w-sm text-base text-gray-700">Start with what&apos;s new this week.</p>
            <Link
              href="/products?sort=newest"
              className="mt-6 inline-flex h-14 items-center gap-2.5 rounded-lg bg-ink px-7 text-base font-semibold text-paper transition hover:bg-black"
            >
              Shop new in
              <HugeiconsIcon icon={ArrowRight02Icon} size={24} strokeWidth={1.8} />
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
