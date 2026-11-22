"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight02Icon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
  Delete02Icon,
  Image01Icon,
  Loading03Icon,
  MinusSignIcon,
  PlusSignIcon,
  ShoppingCart01Icon,
} from "@hugeicons/core-free-icons";
import { ProductImage } from "@/app/components/product-image";
import { api, getAssetUrl } from "@/lib/api";
import { CART_OPEN_EVENT, CART_UPDATED_EVENT, notifyCartUpdated, type CartOpenDetail } from "@/lib/cart-events";
import { getCategoryTheme } from "@/lib/category-colors";
import { formatPrice } from "@/lib/format";

type CartItem = {
  id: string;
  quantity: number;
  selectedColor?: string | null;
  productImageId?: string | null;
  product: {
    id: string;
    name: string;
    price: number | string;
    image?: string | null;
    stock: number;
    category?: { name: string; slug?: string } | null;
    images?: { id: string; url: string; isPrimary: boolean }[];
  };
};

type Cart = { id: string; items: CartItem[] };

const itemImage = (item: CartItem) => {
  const images = item.product.images || [];
  return (
    images.find((image) => image.id === item.productImageId)?.url ||
    images.find((image) => image.isPrimary)?.url ||
    images[0]?.url ||
    item.product.image
  );
};

export function CartDrawer() {
  const pathname = usePathname();
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  // The drawer belongs to the page it was opened on; navigating (e.g. to checkout) closes it.
  const open = openedOn !== null && openedOn === pathname;
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);
  const [signedOut, setSignedOut] = useState(false);
  const [addedName, setAddedName] = useState<string | null>(null);
  const [busyItemId, setBusyItemId] = useState<string | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  const loadCart = useCallback(async () => {
    setLoading(true);
    try {
      const data = (await api.getCart()) as Cart | null;
      setCart(data);
      setSignedOut(false);
    } catch {
      setCart(null);
      setSignedOut(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const close = useCallback(() => {
    setOpenedOn(null);
    setAddedName(null);
    returnFocusRef.current?.focus?.();
  }, []);

  useEffect(() => {
    const onOpen = (event: Event) => {
      const detail = (event as CustomEvent<CartOpenDetail>).detail || {};
      returnFocusRef.current = document.activeElement as HTMLElement | null;
      setAddedName(detail.addedName || null);
      setOpenedOn(window.location.pathname);
      void loadCart();
    };
    window.addEventListener(CART_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(CART_OPEN_EVENT, onOpen);
  }, [loadCart]);

  useEffect(() => {
    if (!open) return;
    const onUpdated = () => void loadCart();
    window.addEventListener(CART_UPDATED_EVENT, onUpdated);
    return () => window.removeEventListener(CART_UPDATED_EVENT, onUpdated);
  }, [open, loadCart]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  const items = useMemo(() => cart?.items || [], [cart]);
  const count = items.reduce((total, item) => total + item.quantity, 0);
  const subtotal = items.reduce((total, item) => total + Number(item.product.price) * item.quantity, 0);

  const updateQuantity = async (item: CartItem, quantity: number) => {
    if (quantity > item.product.stock) {
      toast.error(`Only ${item.product.stock} left in stock.`);
      return;
    }
    setBusyItemId(item.id);
    try {
      if (quantity <= 0) {
        await api.removeFromCart(item.id);
      } else {
        await api.updateCartItem(item.id, quantity);
      }
      setCart((current) =>
        current
          ? {
              ...current,
              items:
                quantity <= 0
                  ? current.items.filter((entry) => entry.id !== item.id)
                  : current.items.map((entry) => (entry.id === item.id ? { ...entry, quantity } : entry)),
            }
          : current
      );
      notifyCartUpdated();
    } catch {
      toast.error("Couldn't update your cart. Please try again.");
    } finally {
      setBusyItemId(null);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70]">
      <button type="button" aria-label="Close cart" tabIndex={-1} onClick={close} className="absolute inset-0 h-full w-full cursor-default bg-ink/45" />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
        className="absolute top-0 right-0 bottom-0 flex w-full max-w-[460px] flex-col border-l-[1.5px] border-ink bg-paper"
      >
        <div className="flex items-center justify-between border-b-[1.5px] border-ink px-5 py-4">
          <h2 id="cart-drawer-title" className="flex items-center gap-2.5 text-3xl font-extrabold">
            Your cart
            {!signedOut && (
              <span className="rounded-md border-[1.5px] border-ink bg-sun px-2 py-0.5 font-mono text-base font-semibold">{count}</span>
            )}
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={close}
            aria-label="Close cart"
            className="flex h-11 w-11 items-center justify-center rounded-lg border-[1.5px] border-ink bg-white transition hover:bg-sun"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={24} strokeWidth={1.8} />
          </button>
        </div>

        {addedName && (
          <p className="mx-5 mt-4 flex items-center gap-2.5 rounded-lg bg-leaf-soft px-3.5 py-3 text-[15px] font-medium" role="status">
            <HugeiconsIcon icon={CheckmarkCircle02Icon} size={24} strokeWidth={1.7} className="shrink-0 text-leaf" />
            <span className="min-w-0 truncate">{addedName} added</span>
          </p>
        )}

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {loading && !cart ? (
            <div className="flex h-40 items-center justify-center text-gray-600">
              <HugeiconsIcon icon={Loading03Icon} size={32} className="animate-spin" />
            </div>
          ) : signedOut ? (
            <div className="flex flex-col items-center gap-4 py-12 text-center">
              <span className="flex h-20 w-20 items-center justify-center rounded-lg border-[1.5px] border-ink bg-sun">
                <HugeiconsIcon icon={ShoppingCart01Icon} size={44} strokeWidth={1.4} />
              </span>
              <p className="max-w-xs text-base text-gray-700">Log in to see your cart and pick up where you left off.</p>
              <Link href="/login" className="inline-flex h-12 items-center rounded-lg bg-ink px-6 font-semibold text-paper hover:bg-black">
                Log in
              </Link>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-12 text-center">
              <span className="flex h-20 w-20 items-center justify-center rounded-lg border-[1.5px] border-ink bg-pink">
                <HugeiconsIcon icon={ShoppingCart01Icon} size={44} strokeWidth={1.4} />
              </span>
              <p className="text-base text-gray-700">Your cart&apos;s empty.</p>
              <Link
                href="/products?sort=newest"
                className="inline-flex h-12 items-center gap-2 rounded-lg bg-ink px-6 font-semibold text-paper hover:bg-black"
              >
                Start with New in
                <HugeiconsIcon icon={ArrowRight02Icon} size={22} strokeWidth={1.8} />
              </Link>
            </div>
          ) : (
            <ul className="flex flex-col gap-5">
              {items.map((item) => {
                const url = getAssetUrl(itemImage(item));
                const theme = getCategoryTheme(item.product.category);
                const busy = busyItemId === item.id;
                return (
                  <li key={item.id} className={`flex gap-4 ${busy ? "opacity-60" : ""}`}>
                    <Link
                      href={`/products/${item.product.id}`}
                      className="relative h-28 w-24 shrink-0 overflow-hidden rounded-lg border-[1.5px] border-ink"
                      style={{ background: theme.soft }}
                      tabIndex={-1}
                      aria-hidden="true"
                    >
                      {url ? (
                        <ProductImage src={url} alt="" fill className="object-cover mix-blend-multiply" sizes="96px" />
                      ) : (
                        <span className="flex h-full items-center justify-center text-gray-500">
                          <HugeiconsIcon icon={Image01Icon} size={28} />
                        </span>
                      )}
                    </Link>
                    <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
                      <div className="flex justify-between gap-3">
                        <div className="min-w-0">
                          <Link href={`/products/${item.product.id}`} className="line-clamp-2 font-semibold underline-offset-4 hover:underline">
                            {item.product.name}
                          </Link>
                          {item.selectedColor && <p className="text-sm text-gray-600 capitalize">{item.selectedColor}</p>}
                        </div>
                        <span className="price-tag shrink-0 text-[15px]">{formatPrice(Number(item.product.price) * item.quantity)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="inline-flex items-center rounded-lg border-[1.5px] border-ink bg-white">
                          <button
                            type="button"
                            onClick={() => void updateQuantity(item, item.quantity - 1)}
                            disabled={busy}
                            aria-label={`Decrease quantity of ${item.product.name}`}
                            className="flex h-11 w-11 items-center justify-center disabled:opacity-40"
                          >
                            <HugeiconsIcon icon={MinusSignIcon} size={20} strokeWidth={1.8} />
                          </button>
                          <span className="w-8 text-center font-mono font-semibold" aria-live="polite">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => void updateQuantity(item, item.quantity + 1)}
                            disabled={busy || item.quantity >= item.product.stock}
                            aria-label={`Increase quantity of ${item.product.name}`}
                            className="flex h-11 w-11 items-center justify-center disabled:opacity-40"
                          >
                            <HugeiconsIcon icon={PlusSignIcon} size={20} strokeWidth={1.8} />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => void updateQuantity(item, 0)}
                          disabled={busy}
                          aria-label={`Remove ${item.product.name}`}
                          className="flex h-11 w-11 items-center justify-center rounded-lg text-gray-600 transition hover:bg-red-50 hover:text-danger"
                        >
                          <HugeiconsIcon icon={Delete02Icon} size={22} strokeWidth={1.6} />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="flex flex-col gap-3 border-t-[1.5px] border-ink bg-white px-5 pt-4 pb-5">
            <div className="flex items-baseline justify-between">
              <span className="text-base">Subtotal</span>
              <span className="price-tag text-2xl">{formatPrice(subtotal)}</span>
            </div>
            <p className="text-sm text-gray-600">Delivery is chosen at checkout.</p>
            <Link
              href="/checkout"
              className="flex h-14 items-center justify-center gap-2.5 rounded-lg bg-ink text-base font-semibold text-paper transition hover:bg-black"
            >
              Checkout
              <HugeiconsIcon icon={ArrowRight02Icon} size={24} strokeWidth={1.8} />
            </Link>
            <div className="flex justify-between text-[15px] font-medium">
              <button type="button" onClick={close} className="underline-offset-4 hover:underline">
                Keep shopping
              </button>
              <Link href="/cart" className="underline-offset-4 hover:underline">
                View full cart
              </Link>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
