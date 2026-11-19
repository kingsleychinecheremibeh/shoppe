"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag, ChevronRight, Loader2, ShieldCheck, Truck, RefreshCw, Minus, Plus } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { ProductImage } from "@/app/components/product-image";
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

export default function ProductDetailClient({ productId }: { productId: string }) {
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    if (!productId) return;

    const fetchProduct = async () => {
      try {
        const productData = await api.getProduct(productId);
        if (!productData) {
          toast.error("Product not found.");
          router.push("/products");
          return;
        }
        const fetchedProduct = productData as Product;
        const defaultImage =
          fetchedProduct.images?.find((image) => image.isPrimary) ||
          fetchedProduct.images?.[0];

        setProduct(fetchedProduct);
        setSelectedImageId(defaultImage?.id || null);
      } catch {
        toast.error("Unable to load product information.");
        router.push("/products");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId, router]);

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
      toast.success(`${quantity} ${quantity > 1 ? "items" : "item"} added to cart!`);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("cart-updated"));
      }
    } catch {
      toast.error("Please login to add items to your cart.");
      router.push("/login");
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
          <div className="aspect-4/5 animate-pulse rounded-2xl bg-gray-100" />
          <div className="space-y-4 pt-4">
            <div className="h-4 w-24 animate-pulse rounded bg-gray-100" />
            <div className="h-9 w-3/4 animate-pulse rounded bg-gray-100" />
            <div className="h-7 w-32 animate-pulse rounded bg-gray-100" />
            <div className="h-12 w-full animate-pulse rounded-full bg-gray-100" />
          </div>
        </div>
      </main>
    );
  }

  if (!product) {
    return null;
  }

  const isOutOfStock = product.stock <= 0;
  const isLowStock = !isOutOfStock && product.stock <= 5;
  const selectedImage =
    product.images?.find((image) => image.id === selectedImageId) ||
    product.images?.find((image) => image.isPrimary) ||
    product.images?.[0];
  const imageUrl = getAssetUrl(selectedImage?.url || product.image);
  const galleryImages = product.images || [];
  const hasColors = galleryImages.some((image) => image.color);

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1.5 text-sm text-gray-500">
          <Link href="/products" className="transition hover:text-gray-950">
            Shop
          </Link>
          {product.category && (
            <>
              <ChevronRight className="h-3.5 w-3.5 text-gray-300" aria-hidden="true" />
              <Link href={`/category/${product.category.slug}`} className="transition hover:text-gray-950">
                {product.category.name}
              </Link>
            </>
          )}
          <ChevronRight className="h-3.5 w-3.5 text-gray-300" aria-hidden="true" />
          <span className="truncate text-gray-900">{product.name}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Gallery */}
          <div className="space-y-3">
            <div className="relative aspect-4/5 overflow-hidden rounded-2xl bg-canvas">
              {imageUrl ? (
                <ProductImage
                  src={imageUrl}
                  alt={selectedImage?.altText || product.name}
                  fill
                  priority
                  className={`object-cover ${isOutOfStock ? "opacity-70" : ""}`}
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
                  No image yet
                </div>
              )}
              {isOutOfStock && (
                <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-xs font-medium text-gray-700 shadow-sm">
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
                      className={`relative aspect-square overflow-hidden rounded-xl bg-canvas transition ${
                        isSelected ? "ring-2 ring-gray-950 ring-offset-2" : "opacity-80 hover:opacity-100"
                      }`}
                    >
                      {thumbnailUrl ? (
                        <ProductImage src={thumbnailUrl} alt="" fill className="object-cover" sizes="96px" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            {product.category && (
              <Link
                href={`/category/${product.category.slug}`}
                className="text-sm font-medium text-brand transition hover:text-brand-hover"
              >
                {product.category.name}
              </Link>
            )}
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-950 sm:text-4xl">
              {product.name}
            </h1>
            <p className="mt-4 text-2xl font-semibold text-gray-950">{formatPrice(product.price)}</p>

            <p
              className={`mt-3 inline-flex items-center gap-2 text-sm ${
                isOutOfStock ? "text-gray-500" : isLowStock ? "text-brand" : "text-emerald-700"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  isOutOfStock ? "bg-gray-400" : isLowStock ? "bg-brand" : "bg-emerald-500"
                }`}
                aria-hidden="true"
              />
              {isOutOfStock ? "Sold out" : isLowStock ? `Only ${product.stock} left` : "In stock"}
            </p>

            {hasColors && (
              <div className="mt-8">
                <p className="mb-3 text-sm font-medium text-gray-900">
                  Colour: <span className="font-normal capitalize text-gray-600">{selectedImage?.color || "Default"}</span>
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
                        className={`h-9 w-9 rounded-full border border-gray-200 transition ${
                          isSelected ? "ring-2 ring-gray-950 ring-offset-2" : "hover:ring-2 hover:ring-gray-300 hover:ring-offset-2"
                        }`}
                        style={{ backgroundColor: getSwatchColor(image.color) }}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {!isOutOfStock && (
              <div className="mt-8 flex gap-3">
                <div className="inline-flex h-12 items-center rounded-full border border-gray-200">
                  <button
                    type="button"
                    onClick={handleDecrease}
                    disabled={quantity <= 1}
                    aria-label="Decrease quantity"
                    className="flex h-12 w-11 items-center justify-center rounded-l-full text-gray-600 transition hover:text-gray-950 disabled:opacity-30"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-8 select-none text-center text-sm font-medium text-gray-950" aria-live="polite">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={handleIncrease}
                    disabled={quantity >= product.stock}
                    aria-label="Increase quantity"
                    className="flex h-12 w-11 items-center justify-center rounded-r-full text-gray-600 transition hover:text-gray-950 disabled:opacity-30"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={addingToCart}
                  className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-brand px-6 text-sm font-medium text-white transition hover:bg-brand-hover disabled:opacity-60"
                >
                  {addingToCart ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingBag className="h-4 w-4" />}
                  {addingToCart ? "Adding…" : "Add to cart"}
                </button>
              </div>
            )}

            {/* Description */}
            <div className="mt-10 border-t border-gray-100 pt-6">
              <h2 className="text-sm font-medium text-gray-900">Details</h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-gray-600">
                {product.description || "More details about this product are coming soon."}
              </p>
            </div>

            {/* Delivery & returns */}
            <ul className="mt-8 space-y-4 rounded-2xl bg-canvas p-5">
              <li className="flex gap-3">
                <Truck className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden="true" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Delivery in {storeConfig.deliveryTime}</p>
                  <p className="text-sm text-gray-500">Shipping fee is shown at checkout.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <RefreshCw className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden="true" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{storeConfig.returnWindowDays}-day returns</p>
                  <Link href="/refund-policy" className="text-sm text-gray-500 underline-offset-4 hover:underline">
                    Read the return policy
                  </Link>
                </div>
              </li>
              <li className="flex gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden="true" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Secure payment</p>
                  <Link href="/secure-checkout" className="text-sm text-gray-500 underline-offset-4 hover:underline">
                    Paid safely through Paystack
                  </Link>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
