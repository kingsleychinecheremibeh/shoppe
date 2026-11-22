"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight01Icon,
  Cancel01Icon,
  SearchAddIcon,
  CheckmarkCircle02Icon,
  DeliveryTruck01Icon,
  Image01Icon,
  Loading03Icon,
  MinusSignIcon,
  PlusSignIcon,
  RefreshIcon,
  Shield01Icon,
  ShoppingCart01Icon,
} from "@hugeicons/core-free-icons";
import { ProductImage } from "@/app/components/product-image";
import { ProductCard, type ProductCardProduct } from "@/app/components/product-card";
import { notifyCartUpdated, openCart } from "@/lib/cart-events";
import { getCategoryTheme } from "@/lib/category-colors";
import { api, getAssetUrl } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { storeConfig } from "@/lib/store-config";

type Category = {
  id: string;
  name: string;
  slug: string;
};

type Product = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number | string;
  image?: string | null;
  stock: number;
  category?: Category;
  images?: ProductGalleryImage[];
};

type ProductGalleryImage = {
  id: string;
  url: string;
  altText?: string | null;
  isPrimary: boolean;
  color?: string | null;
};

const colorSwatches: Record<string, string> = {
  black: "#111827",
  blue: "#2563eb",
  brown: "#92400e",
  gray: "#6b7280",
  green: "#16a34a",
  grey: "#6b7280",
  orange: "#ea580c",
  pink: "#db2777",
  purple: "#7c3aed",
  red: "#dc2626",
  white: "#ffffff",
  yellow: "#ca8a04",
};

const getSwatchColor = (color?: string | null) => {
  if (!color) return "#e5e7eb";
  const normalized = color.trim().toLowerCase();
  return colorSwatches[normalized] || normalized;
};

export type ProductDetail = Product;

const getDefaultImageId = (product: Product | null) =>
  (product?.images?.find((image) => image.isPrimary) || product?.images?.[0])?.id || null;

export default function ProductDetailClient({
  productId,
  initialProduct = null,
  related = [],
}: {
  productId: string;
  /** Product loaded on the server, so the page (and search engines) see it without waiting for JS. */
  initialProduct?: Product | null;
  /** Up to four other products from the same category. */
  related?: ProductCardProduct[];
}) {
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(initialProduct);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(getDefaultImageId(initialProduct));
  const [loading, setLoading] = useState(!initialProduct);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    if (!zoomed) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setZoomed(false);
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [zoomed]);

  useEffect(() => {
    if (!productId) return;
    const hasInitialProduct = Boolean(initialProduct);

    const fetchProduct = async () => {
      try {
        const productData = await api.getProduct(productId);
        if (!productData) {
          if (hasInitialProduct) return;
          toast.error("Product not found.");
          router.push("/products");
          return;
        }
        const fetchedProduct = productData as Product;
        setProduct(fetchedProduct);
        // Keep the shopper's colour choice when refreshing; only pick a default the first time.
        setSelectedImageId((current) => current ?? getDefaultImageId(fetchedProduct));
      } catch {
        // With server-rendered data already on screen, a failed background refresh is not fatal.
        if (hasInitialProduct) return;
        toast.error("Unable to load product information.");
        router.push("/products");
      } finally {
        setLoading(false);
      }
    };

    // Always refresh in the browser: the server copy can be up to a minute old, and stock changes.
    void fetchProduct();
  }, [productId, router, initialProduct]);

  const handleDecrease = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  const handleIncrease = () => {
    if (product && quantity < product.stock) {
      setQuantity(quantity + 1);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;

    if (product.stock <= 0) {
      toast.error("This product is out of stock.");
      return;
    }

    try {
      setAddingToCart(true);
      const selectedImage =
        product.images?.find((img) => img.id === selectedImageId) ||
        product.images?.find((img) => img.isPrimary) ||
        product.images?.[0];
      const selectedColor = selectedImage?.color || undefined;
      await api.addToCart(product.id, quantity, selectedColor, selectedImage?.id);
      notifyCartUpdated();
      openCart({ addedName: quantity > 1 ? `${quantity} × ${product.name}` : product.name });
      setJustAdded(true);
      window.setTimeout(() => setJustAdded(false), 1800);
    } catch {
      toast.error("Please login to add items to your cart.");
      router.push("/login");
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:gap-14 lg:px-8">
          <div className="aspect-square animate-pulse rounded-lg border-[1.5px] border-gray-300 bg-blue-soft" />
          <div className="space-y-5 pt-4">
            <div className="h-9 w-32 animate-pulse rounded-md bg-canvas" />
            <div className="h-16 w-3/4 animate-pulse rounded-md bg-canvas" />
            <div className="h-10 w-40 animate-pulse rounded-md bg-canvas" />
            <div className="h-14 w-full animate-pulse rounded-lg bg-canvas" />
          </div>
        </div>
      </main>
    );
  }

  if (!product) {
    return null;
  }

  const LOW_STOCK = 8;
  const isOutOfStock = product.stock <= 0;
  const isLowStock = !isOutOfStock && product.stock <= LOW_STOCK;
  const selectedImage =
    product.images?.find((image) => image.id === selectedImageId) ||
    product.images?.find((image) => image.isPrimary) ||
    product.images?.[0];
  const imageUrl = getAssetUrl(selectedImage?.url || product.image);
  const galleryImages = product.images || [];
  const hasColors = galleryImages.some((image) => image.color);
  const theme = getCategoryTheme(product.category);

  return (
    <main className="min-h-screen pb-24 lg:pb-0">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-1.5 text-[15px] text-gray-600">
          <Link href="/products" className="underline-offset-4 hover:text-ink hover:underline">
            Shop
          </Link>
          {product.category && (
            <>
              <HugeiconsIcon icon={ArrowRight01Icon} size={18} className="text-gray-400" aria-hidden="true" />
              <Link href={`/category/${product.category.slug}`} className="underline-offset-4 hover:text-ink hover:underline">
                {product.category.name}
              </Link>
            </>
          )}
          <HugeiconsIcon icon={ArrowRight01Icon} size={18} className="text-gray-400" aria-hidden="true" />
          <span className="truncate text-ink">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-14">
          {/* Gallery */}
          <div className="space-y-3">
            <div
              className="relative aspect-square overflow-hidden rounded-lg border-[1.5px] border-ink"
              style={{ background: theme.soft }}
            >
              {imageUrl ? (
                <button
                  type="button"
                  onClick={() => setZoomed(true)}
                  className="group/zoom absolute inset-0 h-full w-full cursor-zoom-in"
                  aria-label={`Zoom in on ${product.name}`}
                >
                  <ProductImage
                    src={imageUrl}
                    alt={selectedImage?.altText || product.name}
                    fill
                    priority
                    className={`object-cover mix-blend-multiply ${isOutOfStock ? "opacity-60 grayscale" : ""}`}
                    sizes="(max-width: 1024px) 100vw, 55vw"
                  />
                  <span className="absolute right-4 bottom-4 flex h-11 w-11 items-center justify-center rounded-lg border-[1.5px] border-ink bg-white text-ink transition group-hover/zoom:bg-sun">
                    <HugeiconsIcon icon={SearchAddIcon} size={24} strokeWidth={1.7} />
                  </span>
                </button>
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-gray-600">
                  <HugeiconsIcon icon={Image01Icon} size={56} strokeWidth={1.3} />
                  No photo yet
                </div>
              )}
              {isOutOfStock && (
                <span className="absolute top-4 left-4 rounded-md border-[1.5px] border-ink bg-white px-2.5 py-1 font-mono text-xs font-semibold uppercase">
                  Sold out
                </span>
              )}
            </div>

            {galleryImages.length > 1 && (
              <div className="grid grid-cols-5 gap-3">
                {galleryImages.map((image) => {
                  const thumbnailUrl = getAssetUrl(image.url);
                  const isSelected = image.id === selectedImage?.id;

                  return (
                    <button
                      key={image.id}
                      type="button"
                      onClick={() => setSelectedImageId(image.id)}
                      aria-label={`Show ${image.color || "alternate"} image`}
                      aria-pressed={isSelected}
                      className={`relative aspect-square overflow-hidden rounded-lg border-[1.5px] transition ${
                        isSelected ? "border-ink shadow-sticker-sm" : "border-gray-300 hover:border-ink"
                      }`}
                      style={{ background: theme.soft }}
                    >
                      {thumbnailUrl ? (
                        <ProductImage src={thumbnailUrl} alt="" fill className="object-cover mix-blend-multiply" sizes="120px" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col gap-6 lg:sticky lg:top-32 lg:self-start">
            {product.category && (
              <Link
                href={`/category/${product.category.slug}`}
                className="inline-flex items-center gap-2 self-start rounded-lg border-[1.5px] border-ink py-1.5 pr-3 pl-2 text-sm font-semibold transition hover:shadow-sticker-sm"
                style={{ background: theme.solid, color: theme.onSolid }}
              >
                <HugeiconsIcon icon={theme.icon} size={24} strokeWidth={1.6} />
                {product.category.name}
              </Link>
            )}

            <h1 className="text-5xl leading-[0.95] font-extrabold tracking-[-0.04em] text-ink sm:text-6xl">{product.name}</h1>

            <p className="price-tag text-4xl text-ink">{formatPrice(product.price)}</p>

            <div
              className={`flex items-center gap-3 rounded-lg border-[1.5px] border-ink px-4 py-3.5 ${
                isOutOfStock ? "bg-gray-100" : isLowStock ? "bg-sun-soft" : "bg-white"
              }`}
              role="status"
            >
              <HugeiconsIcon
                icon={CheckmarkCircle02Icon}
                size={30}
                strokeWidth={1.7}
                className={isOutOfStock ? "text-gray-500" : isLowStock ? "text-ink" : "text-leaf"}
              />
              <span className="text-base">
                {isOutOfStock ? (
                  <strong>Sold out</strong>
                ) : isLowStock ? (
                  <>
                    <strong>Only {product.stock} left</strong> — order soon
                  </>
                ) : (
                  <>
                    <strong>In stock</strong> — {product.stock} available
                  </>
                )}
              </span>
            </div>

            {hasColors && (
              <div>
                <p className="mb-3 text-[15px] font-semibold text-ink">
                  Colour: <span className="font-normal text-gray-700 capitalize">{selectedImage?.color || "Default"}</span>
                </p>
                <div className="flex flex-wrap gap-3">
                  {galleryImages.map((image) => {
                    const isSelected = image.id === selectedImage?.id;
                    return (
                      <button
                        key={image.id}
                        type="button"
                        onClick={() => setSelectedImageId(image.id)}
                        aria-label={image.color || "Default"}
                        aria-pressed={isSelected}
                        title={image.color || "Default"}
                        className={`h-11 w-11 rounded-lg border-[1.5px] border-ink transition ${
                          isSelected ? "shadow-sticker-sm -translate-x-px -translate-y-px" : "hover:shadow-sticker-sm"
                        }`}
                        style={{ backgroundColor: getSwatchColor(image.color) }}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {!isOutOfStock && (
              <div className="flex gap-3">
                <div className="inline-flex h-14 items-center rounded-lg border-[1.5px] border-ink bg-white">
                  <button
                    type="button"
                    onClick={handleDecrease}
                    disabled={quantity <= 1}
                    aria-label="Decrease quantity"
                    className="flex h-14 w-12 items-center justify-center disabled:opacity-30"
                  >
                    <HugeiconsIcon icon={MinusSignIcon} size={22} strokeWidth={1.8} />
                  </button>
                  <span className="w-9 text-center font-mono text-lg font-semibold select-none" aria-live="polite">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={handleIncrease}
                    disabled={quantity >= product.stock}
                    aria-label="Increase quantity"
                    className="flex h-14 w-12 items-center justify-center disabled:opacity-30"
                  >
                    <HugeiconsIcon icon={PlusSignIcon} size={22} strokeWidth={1.8} />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={addingToCart}
                  className={`inline-flex h-14 flex-1 items-center justify-center gap-2.5 rounded-lg px-6 text-base font-semibold transition disabled:opacity-60 ${
                    justAdded ? "border-[1.5px] border-ink bg-leaf text-ink" : "bg-ink text-paper hover:bg-black"
                  }`}
                >
                  <HugeiconsIcon
                    key={justAdded ? "added" : addingToCart ? "adding" : "idle"}
                    icon={justAdded ? CheckmarkCircle02Icon : addingToCart ? Loading03Icon : ShoppingCart01Icon}
                    size={26}
                    strokeWidth={1.6}
                    className={addingToCart ? "animate-spin" : justAdded ? "animate-pop-in" : ""}
                  />
                  <span aria-live="polite">{justAdded ? "Added" : addingToCart ? "Adding…" : "Add to cart"}</span>
                </button>
              </div>
            )}

            <div className="border-t-[1.5px] border-ink pt-5">
              <h2 className="text-2xl font-extrabold">Details</h2>
              <p className="mt-2 text-base leading-relaxed whitespace-pre-line text-gray-700">
                {product.description || "More details about this product are coming soon."}
              </p>
            </div>

            <ul className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              <li className="flex items-center gap-3 rounded-lg bg-sun-soft p-3.5">
                <HugeiconsIcon icon={DeliveryTruck01Icon} size={34} strokeWidth={1.5} className="shrink-0" />
                <span className="text-sm leading-snug">
                  <strong className="block">{storeConfig.deliveryTime}</strong>
                  Fee shown at checkout
                </span>
              </li>
              <li className="flex items-center gap-3 rounded-lg bg-leaf-soft p-3.5">
                <HugeiconsIcon icon={RefreshIcon} size={34} strokeWidth={1.5} className="shrink-0" />
                <span className="text-sm leading-snug">
                  <strong className="block">{storeConfig.returnWindowDays}-day returns</strong>
                  <Link href="/refund-policy" className="underline underline-offset-4">
                    Return policy
                  </Link>
                </span>
              </li>
              <li className="flex items-center gap-3 rounded-lg bg-pink-soft p-3.5">
                <HugeiconsIcon icon={Shield01Icon} size={34} strokeWidth={1.5} className="shrink-0" />
                <span className="text-sm leading-snug">
                  <strong className="block">Secure payment</strong>
                  <Link href="/secure-checkout" className="underline underline-offset-4">
                    Via Paystack
                  </Link>
                </span>
              </li>
            </ul>
          </div>
        </div>

        {related.length > 0 && product.category && (
          <section className="mt-16" aria-labelledby="related-title">
            <div className="mb-6 flex items-end justify-between gap-4">
              <h2 id="related-title" className="text-4xl font-extrabold text-ink">
                More in {product.category.name}
              </h2>
              <Link href={`/category/${product.category.slug}`} className="text-[15px] font-semibold underline-offset-4 hover:underline">
                See all
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-5 lg:grid-cols-4">
              {related.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Phones: keep price and Add to cart in reach while scrolling */}
      {!isOutOfStock && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t-[1.5px] border-ink bg-paper px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] lg:hidden">
          <div className="flex items-center gap-4">
            <div className="min-w-0">
              <p className="truncate text-sm text-gray-700">{product.name}</p>
              <p className="price-tag text-xl text-ink">{formatPrice(product.price)}</p>
            </div>
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={addingToCart}
              className={`ml-auto inline-flex h-12 shrink-0 items-center gap-2 rounded-lg px-5 text-[15px] font-semibold transition disabled:opacity-60 ${
                justAdded ? "border-[1.5px] border-ink bg-leaf text-ink" : "bg-ink text-paper"
              }`}
            >
              <HugeiconsIcon icon={justAdded ? CheckmarkCircle02Icon : ShoppingCart01Icon} size={22} strokeWidth={1.7} />
              {justAdded ? "Added" : "Add to cart"}
            </button>
          </div>
        </div>
      )}

      {zoomed && imageUrl && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${product.name} photo`}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/85 p-4"
          onClick={() => setZoomed(false)}
        >
          <button
            type="button"
            onClick={() => setZoomed(false)}
            aria-label="Close photo"
            autoFocus
            className="absolute top-4 right-4 flex h-12 w-12 items-center justify-center rounded-lg border-[1.5px] border-ink bg-white text-ink"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={26} strokeWidth={1.8} />
          </button>
          <div className="relative h-[85vh] w-full max-w-4xl overflow-hidden rounded-lg border-[1.5px] border-ink" style={{ background: theme.soft }}>
            <ProductImage src={imageUrl} alt={selectedImage?.altText || product.name} fill className="object-contain mix-blend-multiply" sizes="100vw" />
          </div>
        </div>
      )}
    </main>
  );
}
