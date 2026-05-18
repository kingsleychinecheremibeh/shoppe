"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Plus, CheckCircle, CreditCard, ShoppingCart, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { api } from "@/lib/api";
import Script from "next/script";

type Address = {
  id: string;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  country: string;
};

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

export default function CheckoutPage() {
  const router = useRouter();

  const [cart, setCart] = useState<Cart | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [paymentGateway, setPaymentGateway] = useState<"STRIPE" | "PAYSTACK">("PAYSTACK");
  const [idempotencyKey, setIdempotencyKey] = useState<string>("");
  const [user, setUser] = useState<{ email: string; name: string } | null>(null);

  // Address creation form state
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [creatingAddress, setCreatingAddress] = useState(false);
  const [addressForm, setAddressForm] = useState({
    fullName: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    country: "United States",
  });

  const loadCheckoutData = async () => {
    try {
      const [cartData, addressesData, userData] = await Promise.all([
        api.getCart(),
        api.getAddresses(),
        api.getMe(),
      ]);

      const cartObj = cartData as Cart;
      if (!cartObj || !cartObj.items || cartObj.items.length === 0) {
        toast.error("Your cart is empty. Add products before checking out.");
        router.push("/products");
        return;
      }

      setCart(cartObj);
      const addrList = (addressesData as Address[]) || [];
      setAddresses(addrList);
      setUser(userData as { email: string; name: string });

      if (addrList.length > 0) {
        setSelectedAddressId(addrList[0].id);
      }
    } catch (error) {
      console.error("Failed to load checkout details:", error);
      toast.error("Please login to proceed with checkout.");
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCheckoutData();
    if (typeof window !== "undefined" && window.crypto?.randomUUID) {
      setIdempotencyKey(window.crypto.randomUUID());
    } else {
      setIdempotencyKey(Math.random().toString(36).substring(2) + Date.now().toString(36));
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setAddressForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault();

    // Simple Validation
    const { fullName, phone, street, city, state, country } = addressForm;
    if (!fullName || !phone || !street || !city || !state || !country) {
      toast.error("All address fields are required.");
      return;
    }

    try {
      setCreatingAddress(true);
      const newAddress = (await api.createAddress(addressForm)) as Address;
      toast.success("New address added successfully!");
      setAddresses((prev) => [...prev, newAddress]);
      setSelectedAddressId(newAddress.id);
      setShowAddressForm(false);

      // Reset Form
      setAddressForm({
        fullName: "",
        phone: "",
        street: "",
        city: "",
        state: "",
        country: "United States",
      });
    } catch (error) {
      console.error("Failed to create address:", error);
      toast.error("Failed to save new address.");
    } finally {
      setCreatingAddress(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      toast.error("Please select or add a delivery address.");
      return;
    }

    if (paymentGateway === "PAYSTACK") {
      const PaystackPop = (window as any).PaystackPop;

      if (!PaystackPop) {
        toast.error("Initializing secure checkout... Please wait a moment.")
        return;
      }

      try {
        setSubmittingOrder(true);

        // Pre-create order record in DB as PENDING
        const order = (await api.createOrder(selectedAddressId, {
          idempotencyKey,
          paymentGateway: "PAYSTACK",
        })) as { id: string };

        const paystackAmount = Math.round(total * 1600 * 100);
        const paystackRef = idempotencyKey + "_" + Date.now();
        const paystackKey = (process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "").replace(/[^\w-]/g, "").trim();

        const paystack = new PaystackPop();
        paystack.newTransaction({
          key: paystackKey,
          email: user?.email || "customer@example.com",
          amount: paystackAmount,
          currency: "NGN",
          ref: paystackRef,
          metadata: {
            orderId: order.id,
          },
          onSuccess: function (response: any) {
            toast.success("Payment Successful! Thank you for your order");
            if (typeof window !== "undefined") {
              window.dispatchEvent(new Event("cart-updated"));
            }
            router.push(`/checkout/success?orderId=${order.id}`);
          },
          onCancel: () => {
            setSubmittingOrder(false);
            toast.error("Payment modal closed. You can complete payment later in your Order History.");
          }
        });
      } catch (err) {
        console.error("Paystack transaction failed to launch:", err);
        setSubmittingOrder(false);
        toast.error("Failed to initialize payment. Please try again or contact support");
      }
      return;
    }
    try {
      setSubmittingOrder(true);
      const order = (await api.createOrder(selectedAddressId, { idempotencyKey, paymentGateway })) as { id: string };
      toast.success("Order placed successfully! Thank you for shopping.");
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("cart-updated"));
      }
      router.push(`/checkout/success?orderId=${order.id}`);
    } catch (error) {
      console.error("Failed to place order:", error);
      toast.error("Failed to finalize order. Please try again.");
      setSubmittingOrder(false);
    }
  };

  // Math totals
  const subtotal = useMemo(() => {
    if (!cart) return 0;
    return cart.items.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0);
  }, [cart]);

  const shipping = subtotal > 150 ? 0 : 15;
  const total = subtotal + shipping;

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-black" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Navigation Back */}
        <Link
          href="/cart"
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-950 mb-8 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Return to cart
        </Link>

        {/* Title Block */}
        <div className="mb-8 border-b border-gray-200 pb-5">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-950">Checkout</h1>
          <p className="mt-2 text-sm text-gray-600">Enter details to complete your order.</p>
        </div>

        {/* Checkout Columns */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_400px]">

          {/* Main Delivery Info Form */}
          <div className="space-y-6">

            {/* Shipping Address Section */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-xs">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-950 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-gray-900" />
                  Delivery Address
                </h3>
                {!showAddressForm && (
                  <button
                    onClick={() => setShowAddressForm(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-900 hover:underline"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add New Address
                  </button>
                )}
              </div>

              {/* Address selector cards */}
              {!showAddressForm && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {addresses.length > 0 ? (
                    addresses.map((address) => (
                      <button
                        key={address.id}
                        onClick={() => setSelectedAddressId(address.id)}
                        className={`text-left p-4 rounded-xl border text-sm transition relative ${selectedAddressId === address.id
                          ? "border-gray-950 bg-gray-50/50 ring-1 ring-gray-950"
                          : "border-gray-200 hover:border-gray-300"
                          }`}
                      >
                        <div className="pr-6">
                          <p className="font-bold text-gray-950 mb-1">{address.fullName}</p>
                          <p className="text-gray-600 leading-normal mb-1">{address.street}</p>
                          <p className="text-gray-600 mb-1">
                            {address.city}, {address.state}
                          </p>
                          <p className="text-gray-500 font-semibold text-[11px] mb-1">{address.phone}</p>
                        </div>
                        {selectedAddressId === address.id && (
                          <CheckCircle className="absolute top-4 right-4 h-5 w-5 text-gray-950 fill-white" />
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="sm:col-span-2 rounded-lg border border-dashed border-gray-200 p-8 text-center bg-gray-50">
                      <p className="text-sm text-gray-500 mb-3">No saved addresses found.</p>
                      <button
                        onClick={() => setShowAddressForm(true)}
                        className="inline-flex items-center justify-center rounded-md bg-gray-950 px-4 py-2 text-xs font-semibold text-white transition hover:bg-gray-800"
                      >
                        Add Address Form
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Inline Form for creating a new address */}
              {showAddressForm && (
                <form onSubmit={handleCreateAddress} className="space-y-4 border-t border-gray-100 pt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Recipient Full Name</label>
                      <input
                        type="text"
                        name="fullName"
                        value={addressForm.fullName}
                        onChange={handleInputChange}
                        placeholder="John Doe"
                        className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm text-gray-900 focus:border-gray-950 focus:outline-none focus:ring-1 focus:ring-gray-950"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Phone Number</label>
                      <input
                        type="text"
                        name="phone"
                        value={addressForm.phone}
                        onChange={handleInputChange}
                        placeholder="+1 (555) 019-2834"
                        className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm text-gray-900 focus:border-gray-950 focus:outline-none focus:ring-1 focus:ring-gray-950"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Street Address</label>
                    <input
                      type="text"
                      name="street"
                      value={addressForm.street}
                      onChange={handleInputChange}
                      placeholder="123 Shopping Lane, Suite 4B"
                      className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm text-gray-900 focus:border-gray-950 focus:outline-none focus:ring-1 focus:ring-gray-950"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">City</label>
                      <input
                        type="text"
                        name="city"
                        value={addressForm.city}
                        onChange={handleInputChange}
                        placeholder="New York"
                        className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm text-gray-900 focus:border-gray-950 focus:outline-none focus:ring-1 focus:ring-gray-950"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">State / Province</label>
                      <input
                        type="text"
                        name="state"
                        value={addressForm.state}
                        onChange={handleInputChange}
                        placeholder="NY"
                        className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm text-gray-900 focus:border-gray-950 focus:outline-none focus:ring-1 focus:ring-gray-950"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Country</label>
                      <select
                        name="country"
                        value={addressForm.country}
                        onChange={handleInputChange}
                        className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm text-gray-900 focus:border-gray-950 focus:outline-none focus:ring-1 focus:ring-gray-950"
                        required
                      >
                        <option value="United States">United States</option>
                        <option value="Canada">Canada</option>
                        <option value="United Kingdom">United Kingdom</option>
                        <option value="Nigeria">Nigeria</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => setShowAddressForm(false)}
                      className="rounded-md border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={creatingAddress}
                      className="rounded-md bg-gray-950 px-4 py-2 text-xs font-semibold text-white hover:bg-gray-800 transition disabled:opacity-50"
                    >
                      {creatingAddress ? "Saving..." : "Save Address"}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Payment Method Selector */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-xs">
              <h3 className="text-lg font-bold text-gray-950 flex items-center gap-2 mb-4">
                <CreditCard className="h-5 w-5 text-gray-900" />
                Payment Method
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Paystack Card Option */}
                <button
                  type="button"
                  onClick={() => setPaymentGateway("PAYSTACK")}
                  className={`relative flex flex-col items-start p-4 rounded-xl border text-left transition-all hover:bg-gray-50 ${paymentGateway === "PAYSTACK"
                    ? "border-gray-950 bg-gray-50/50 ring-1 ring-gray-950"
                    : "border-gray-200 bg-white"
                    }`}
                >
                  <div className="flex items-center gap-2 w-full justify-between mb-2">
                    <span className="text-sm font-bold text-gray-950">Paystack (Local)</span>
                    <div className={`h-4 w-4 rounded-full border flex items-center justify-center ${paymentGateway === "PAYSTACK" ? "border-gray-950 bg-gray-950" : "border-gray-300"
                      }`}>
                      {paymentGateway === "PAYSTACK" && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    Pay securely using bank transfers, local African debit cards, USSD codes, or mobile money.
                  </p>
                </button>

                {/* Stripe Card Option */}
                <button
                  type="button"
                  onClick={() => setPaymentGateway("STRIPE")}
                  className={`relative flex flex-col items-start p-4 rounded-xl border text-left transition-all hover:bg-gray-50 ${paymentGateway === "STRIPE"
                    ? "border-gray-950 bg-gray-50/50 ring-1 ring-gray-950"
                    : "border-gray-200 bg-white"
                    }`}
                >
                  <div className="flex items-center gap-2 w-full justify-between mb-2">
                    <span className="text-sm font-bold text-gray-950">Stripe (Global)</span>
                    <div className={`h-4 w-4 rounded-full border flex items-center justify-center ${paymentGateway === "STRIPE" ? "border-gray-950 bg-gray-950" : "border-gray-300"
                      }`}>
                      {paymentGateway === "STRIPE" && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    Pay securely with Apple Pay, Google Pay, international cards (Visa, MasterCard), or Klarna.
                  </p>
                </button>
              </div>
            </div>


          </div>

          {/* Right Column: Cart items review & final Checkout summary */}
          <aside className="space-y-6">

            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-xs">
              <h3 className="text-lg font-bold text-gray-950 mb-4 border-b border-gray-100 pb-3 flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-gray-400" />
                Order Review
              </h3>

              {/* Items listing */}
              <div className="divide-y divide-gray-100 max-h-60 overflow-y-auto mb-6">
                {cart?.items.map((item) => (
                  <div key={item.id} className="py-3.5 flex gap-4 text-sm">
                    <div className="aspect-square h-12 shrink-0 overflow-hidden rounded bg-gray-50 border border-gray-100">
                      {item.product.image ? (
                        <Image
                          src={item.product.image}
                          alt={item.product.name}
                          className="h-full w-full object-cover"
                          width={60}
                          height={60}
                        />
                      ) : (
                        <div className="h-full w-full bg-gray-100" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-950 truncate">{item.product.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Qty: {item.quantity}</p>
                    </div>
                    <span className="font-semibold text-gray-950 shrink-0">
                      {currencyFormatter.format(Number(item.product.price) * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Calculation List */}
              <div className="space-y-3.5 border-t border-gray-100 pt-4">
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
                  <span className="text-base font-bold text-gray-900">Total</span>
                  <span className="text-2xl font-black text-gray-950">{currencyFormatter.format(total)}</span>
                </div>
              </div>

              {/* Action Order Button */}
              <button
                onClick={handlePlaceOrder}
                disabled={submittingOrder || !selectedAddressId}
                className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gray-950 py-3.5 text-sm font-semibold text-white transition hover:bg-gray-800 shadow-sm disabled:opacity-50"
              >
                {submittingOrder ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Placing Order...
                  </>
                ) : (
                  "Place Order Now"
                )}
              </button>
            </div>

          </aside>

        </div>

      </div>
      <Script
        src="https://js.paystack.co/v2/inline.js"
        strategy="afterInteractive"
      />
    </main>
  );
}
