"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Trash2, ShoppingBag, Plus, Minus, ArrowRight, Truck, ShieldCheck } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { api } from "@/lib/api";

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
};

type CartItem = {
  id: string;
  productId: string;
  quantity: number;
  product: Product;
};

type Cart = {
  id: string;
  items: CartItem[];
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export default function CartPage() {
  const router = useRouter();

  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);

  const fetchCart = async () => {
    try {
      const cartData = await api.getCart();
      setCart((cartData as Cart) || null);
    } catch (error) {
      console.error("Failed to load cart:", error);
      toast.error("Please login to view your cart.");
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
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
    } catch (error) {
      console.error("Failed to update quantity:", error);
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
    } catch (error) {
      console.error("Failed to remove item:", error);
      toast.error("Failed to remove item from cart.");
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleClearCart = async () => {
    if (!confirm("Are you sure you want to empty your cart?")) return;

    try {
      setLoading(true);
      await api.clearCart();
      toast.success("Cart cleared successfully.");
      setCart(null);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("cart-updated"));
      }
    } catch (error) {
      console.error("Failed to clear cart:", error);
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

  const shipping = subtotal > 150 ? 0 : 15;
  const total = subtotal + shipping;

  const freeShippingThreshold = 150;
  const progressToFreeShipping = Math.min((subtotal / freeShippingThreshold) * 100, 100);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-black" />
      </main>
    );
  }

  const hasItems = cart && cart.items.length > 0;

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Header Title */}
        <div className="mb-8 border-b border-gray-200 pb-5">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-950">Shopping Cart</h1>
          <p className="mt-2 text-sm text-gray-600">Review items selected for purchase.</p>
        </div>

        {hasItems ? (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
            
            {/* Items List */}
            <div className="space-y-6">
              
              {/* Free Shipping Progress Alert */}
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
                <div className="flex items-center gap-3 mb-3">
                  <Truck className="h-5 w-5 text-gray-900" />
                  <p className="text-sm font-semibold text-gray-950">
                    {subtotal >= freeShippingThreshold ? (
                      <span className="text-green-600 font-bold">You qualify for FREE shipping!</span>
                    ) : (
                      <>Add <span className="font-bold text-gray-950">{currencyFormatter.format(freeShippingThreshold - subtotal)}</span> more for FREE shipping</>
                    )}
                  </p>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      subtotal >= freeShippingThreshold ? "bg-green-500" : "bg-gray-950"
                    }`}
                    style={{ width: `${progressToFreeShipping}%` }}
                  />
                </div>
              </div>

              {/* Items Card */}
              <div className="rounded-xl border border-gray-200 bg-white shadow-xs overflow-hidden">
                <div className="divide-y divide-gray-200">
                  {cart.items.map((item) => (
                    <div
                      key={item.id}
                      className={`p-6 flex flex-col sm:flex-row gap-6 transition ${
                        updatingItemId === item.id ? "opacity-50 pointer-events-none" : ""
                      }`}
                    >
                      {/* Product Thumbnail */}
                      <Link
                        href={`/products/${item.productId}`}
                        className="aspect-square w-24 sm:w-28 shrink-0 rounded-lg overflow-hidden bg-gray-100 border border-gray-100 block"
                      >
                        {item.product.image ? (
                          <Image
                            src={item.product.image}
                            alt={item.product.name}
                            className="h-full w-full object-cover"
                            width={150}
                            height={150}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-gray-400">
                            No image
                          </div>
                        )}
                      </Link>

                      {/* Text details */}
                      <div className="flex-1 flex flex-col justify-between min-w-0">
                        <div>
                          <div className="flex justify-between items-start gap-4 mb-1">
                            <Link href={`/products/${item.productId}`} className="hover:underline">
                              <h3 className="font-bold text-gray-950 text-base line-clamp-1">{item.product.name}</h3>
                            </Link>
                            <p className="font-black text-gray-950 text-base text-right shrink-0">
                              {currencyFormatter.format(Number(item.product.price) * item.quantity)}
                            </p>
                          </div>
                          <p className="text-xs text-gray-400 uppercase font-semibold mb-3">
                            {item.product.category?.name || "Premium Catalog"}
                          </p>
                        </div>

                        {/* Interactive Quantity Control & Trash Row */}
                        <div className="flex items-center justify-between gap-4 mt-auto">
                          
                          {/* Selector */}
                          <div className="inline-flex items-center rounded-lg border border-gray-300 bg-white">
                            <button
                              onClick={() => handleUpdateQuantity(item, item.quantity - 1)}
                              className="p-2 text-gray-500 hover:text-gray-950 transition"
                              title="Decrease quantity"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="w-10 text-center text-sm font-bold text-gray-950 select-none">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => handleUpdateQuantity(item, item.quantity + 1)}
                              className="p-2 text-gray-500 hover:text-gray-950 transition"
                              title="Increase quantity"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          {/* Trash button */}
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-700 transition p-2 rounded-md hover:bg-red-50"
                            title="Remove item"
                          >
                            <Trash2 className="h-4 w-4" />
                            Remove
                          </button>

                        </div>

                      </div>

                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons underneath */}
              <div className="flex items-center justify-between">
                <Link
                  href="/products"
                  className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-gray-950 transition"
                >
                  Continue Shopping
                </Link>
                
                <button
                  onClick={handleClearCart}
                  className="rounded-lg border border-red-200 bg-red-50 text-red-600 px-5 py-2.5 text-sm font-semibold hover:bg-red-100 hover:text-red-700 transition"
                >
                  Clear Shopping Cart
                </button>
              </div>

            </div>

            {/* Order Summary Panel */}
            <aside className="space-y-6">
              
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-xs">
                <h3 className="text-lg font-bold text-gray-950 mb-4 border-b border-gray-100 pb-3">Order Summary</h3>
                
                <div className="space-y-3.5">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Subtotal</span>
                    <span className="font-semibold text-gray-950">{currencyFormatter.format(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Shipping</span>
                    <span className="font-semibold text-gray-950">
                      {shipping === 0 ? "Free" : currencyFormatter.format(shipping)}
                    </span>
                  </div>
                  
                  <div className="border-t border-gray-100 pt-3.5 flex justify-between items-end">
                    <span className="text-base font-bold text-gray-900">Total Price</span>
                    <span className="text-2xl font-black text-gray-950">{currencyFormatter.format(total)}</span>
                  </div>
                </div>

                <Link
                  href="/checkout"
                  className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gray-950 py-3.5 text-sm font-semibold text-white transition hover:bg-gray-800 shadow-sm"
                >
                  Proceed to Checkout
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              {/* Guarantees panel */}
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-5 flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-gray-900 mb-0.5">Secure Checkout Guaranteed</h4>
                  <p className="text-[10px] text-gray-500 leading-normal">
                    Your personal credentials and payment transactions are fully encrypted. All items undergo physical audits before shipping.
                  </p>
                </div>
              </div>

            </aside>

          </div>
        ) : (
          /* Empty state view */
          <div className="rounded-2xl border border-dashed border-gray-300 py-16 px-6 text-center max-w-lg mx-auto bg-white shadow-xs">
            <div className="mx-auto h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 mb-4 border border-gray-100">
              <ShoppingBag className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-extrabold text-gray-950 mb-2">Your cart is empty</h2>
            <p className="text-gray-500 text-sm mb-8 leading-relaxed max-w-sm mx-auto">
              Looks like you haven&apos;t added any items to your shopping cart yet. Explore our high-quality catalog to find premium collections.
            </p>
            <Link
              href="/products"
              className="inline-flex items-center justify-center rounded-lg bg-gray-950 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-gray-800 shadow-sm"
            >
              Start Shopping
            </Link>
          </div>
        )}

      </div>
    </main>
  );
}
