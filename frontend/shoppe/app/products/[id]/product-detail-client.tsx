"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, ArrowLeft, ShieldCheck, Truck, RefreshCw, Minus, Plus } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { ProductImage } from "@/app/components/product-image";
import { api, getAssetUrl } from "@/lib/api";
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

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "NGN",
});

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
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-black" />
      </main>
    );
  }

  if (!product) {
    return null;
  }

  const isOutOfStock = product.stock <= 0;
  const selectedImage =
    product.images?.find((image) => image.id === selectedImageId) ||
    product.images?.find((image) => image.isPrimary) ||
    product.images?.[0];
  const imageUrl = getAssetUrl(selectedImage?.url || product.image);
  const galleryImages = product.images || [];

  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Back Link */}
        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-950 mb-8 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to products
        </Link>

        {/* Details Grid */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 bg-white rounded-2xl border border-gray-200 p-6 md:p-10 shadow-xs">
          
          {/* Image Viewer */}
          <div className="space-y-4">
            <div className="aspect-square w-full overflow-hidden rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center relative">
              {imageUrl ? (
                <ProductImage
                  src={imageUrl}
                  alt={selectedImage?.altText || product.name}
                  className="h-full w-full object-cover transition duration-300"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              ) : (
                <span className="text-sm font-semibold text-gray-600">No product image</span>
              )}
              
              {isOutOfStock && (
                <div className="absolute top-4 left-4 bg-red-600 text-white text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-md shadow-sm">
                  Out of Stock
                </div>
              )}
            </div>

            {galleryImages.length > 1 && (
              <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
                {galleryImages.map((image) => {
                  const thumbnailUrl = getAssetUrl(image.url);
                  const isSelected = image.id === selectedImage?.id;

                  return (
                    <button
                      key={image.id}
                      type="button"
                      onClick={() => setSelectedImageId(image.id)}
                      className={`group overflow-hidden rounded-lg border bg-white text-left transition ${
                        isSelected ? "border-gray-950 ring-2 ring-gray-950/10" : "border-gray-200 hover:border-gray-400"
                      }`}
                      aria-label={`View ${image.color || "default"} product image`}
                    >
                      <span className="block aspect-square bg-gray-50">
                        {thumbnailUrl ? (
                          <ProductImage
                            src={thumbnailUrl}
                            alt={image.altText || `${product.name} ${image.color || ""}`.trim()}
                            className="h-full w-full object-cover"
                            sizes="96px"
                          />
                        ) : null}
                      </span>
                      <span className="flex items-center gap-1.5 px-2 py-1.5">
                        <span
                          className="h-3 w-3 rounded-full border border-gray-300"
                          style={{ backgroundColor: getSwatchColor(image.color) }}
                        />
                        <span className="truncate text-[10px] font-bold uppercase tracking-wide text-gray-700">
                          {image.color || "Default"}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Details Content Panel */}
          <div className="flex flex-col">
            
            {/* Category Breadcrumb */}
            <span className="text-sm font-bold uppercase tracking-widest text-gray-600 mb-2">
              {product.category?.name || "Uncategorized"}
            </span>
            
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-950 md:text-4xl mb-4">
              {product.name}
            </h1>

            {/* Price block */}
            <p className="text-3xl font-black text-gray-950 mb-6">
              {currencyFormatter.format(Number(product.price))}
            </p>

            {/* Description */}
            <div className="border-t border-gray-100 pt-6 mb-8">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-900 mb-3">Product details</h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                {product.description || "No description has been added for this product yet. Please check the price, stock, color options, and delivery details before adding it to your cart."}
              </p>
            </div>

            {/* Stock Level Indicator */}
            <div className="mb-6 flex items-center gap-2">
              <span className={`inline-block h-2.5 w-2.5 rounded-full ${isOutOfStock ? "bg-red-500" : "bg-green-500"}`} />
              <span className="text-xs font-semibold text-gray-700">
                {isOutOfStock ? "Sold Out" : `In stock (${product.stock} items available)`}
              </span>
            </div>

            {galleryImages.some((image) => image.color) && (
              <div className="mb-6 border-t border-gray-100 pt-6">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-900 mb-3">Color</h3>
                <div className="flex flex-wrap gap-2">
                  {galleryImages.map((image) => {
                    const isSelected = image.id === selectedImage?.id;

                    return (
                      <button
                        key={image.id}
                        type="button"
                        onClick={() => setSelectedImageId(image.id)}
                        className={`inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-bold transition ${
                          isSelected
                            ? "border-gray-950 bg-gray-950 text-white"
                            : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                        }`}
                      >
                        <span
                          className="h-3.5 w-3.5 rounded-full border border-gray-300"
                          style={{ backgroundColor: getSwatchColor(image.color) }}
                        />
                        {image.color || "Default"}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity Controller & Add Button */}
            {!isOutOfStock && (
              <div className="mb-8 border-t border-gray-100 pt-6">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-900 mb-3">Quantity</h3>
                <div className="flex flex-wrap items-center gap-4">
                  
                  {/* Selector */}
                  <div className="inline-flex items-center rounded-lg border border-gray-300 bg-white">
                    <button
                      onClick={handleDecrease}
                      disabled={quantity <= 1}
                      className="p-3 text-gray-500 hover:text-gray-950 transition disabled:opacity-30"
                      title="Decrease quantity"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-12 text-center text-sm font-bold text-gray-950 select-none">
                      {quantity}
                    </span>
                    <button
                      onClick={handleIncrease}
                      disabled={quantity >= product.stock}
                      className="p-3 text-gray-500 hover:text-gray-950 transition disabled:opacity-30"
                      title="Increase quantity"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Add Button */}
                  <button
                    onClick={handleAddToCart}
                    disabled={addingToCart}
                    className="flex-1 min-w-50 inline-flex items-center justify-center gap-2 bg-gray-950 px-6 py-3.5 text-sm font-semibold text-white rounded-lg shadow-sm hover:bg-gray-800 transition disabled:opacity-50"
                  >
                    <ShoppingCart className="h-5 w-5" />
                    {addingToCart ? "Adding to Cart..." : "Add to Cart"}
                  </button>

                </div>
              </div>
            )}

            {/* Value Props Grid */}
            <div className="border-t border-gray-100 pt-6 mt-auto grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <Truck className="h-5 w-5 text-gray-600 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-gray-900">Fast Delivery</p>
                  <p className="text-[10px] text-gray-500">Available for supported areas</p>
                </div>
              </div>
              <Link href="/secure-checkout" className="flex items-center gap-3 rounded-lg transition hover:bg-gray-50">
                <ShieldCheck className="h-5 w-5 text-gray-600 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-gray-900">Secure Checkout</p>
                  <p className="text-[10px] text-gray-500">Payment handled by Paystack</p>
                </div>
              </Link>
              <div className="flex items-center gap-3">
                <RefreshCw className="h-5 w-5 text-gray-600 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-gray-900">Easy Returns</p>
                  <p className="text-[10px] text-gray-500">{storeConfig.returnWindowDays}-day return window</p>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </main>
  );
}
