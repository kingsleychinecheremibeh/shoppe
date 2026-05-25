"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Plus, CheckCircle, CreditCard, ShoppingCart, ArrowLeft, Truck } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { AlertBanner, LoadingButton } from "@/app/components/feedback";
import { ProductImage } from "@/app/components/product-image";
import { api, getAssetUrl } from "@/lib/api";
import { useHydrated } from "@/app/hooks/use-hydrated";
import useSWR, { mutate } from "swr";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

type ShippingMethod = {
  id: string;
  name: string;
  description: string | null;
  price: string | number;
  estimatedDays: string | null;
};

type Address = {
  id: string;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  country: string;
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

type PaymentInitializeResponse = {
  data?: {
    authorizationUrl?: string;
    gateway?: string;
    reference?: string;
  };
};

const addressSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  phone: z.string().min(5, "Valid phone number is required"),
  street: z.string().min(5, "Street address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  country: z.string(),
});

type AddressFormValues = z.infer<typeof addressSchema>;

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "NGN",
});

export default function CheckoutPage() {
  const router = useRouter();

  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [paymentGateway, setPaymentGateway] = useState<"STRIPE" | "PAYSTACK">("PAYSTACK");
  const [idempotencyKey, setIdempotencyKey] = useState<string>("");
  const [checkoutError, setCheckoutError] = useState("");
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [selectedShippingMethodId, setSelectedShippingMethodId] = useState<string>("");
  const mounted = useHydrated();

  // SWR Fetching
  const { data: cartData, isLoading: loadingCart, error: cartError } = useSWR('/cart', () => api.getCart());
  const { data: addressesData, isLoading: loadingAddresses } = useSWR('/addresses', () => api.getAddresses());
  const { data: shippingData, isLoading: loadingShipping } = useSWR('/shipping-methods', () => api.getShippingMethods());

  const cart = (cartData as Cart | undefined) ?? null;
  const addresses = useMemo(() => (addressesData as Address[] | undefined) ?? [], [addressesData]);
  const shippingMethods = useMemo(() => (shippingData as ShippingMethod[] | undefined) ?? [], [shippingData]);
  const loading = loadingCart || loadingAddresses || loadingShipping;

  // React Hook Form
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: { country: "United States" }
  });

  useEffect(() => {
    if (cartError) {
      toast.error("Please login to proceed with checkout.");
      router.push("/login");
    } else if (cart && (!cart.items || cart.items.length === 0)) {
      toast.error("Your cart is empty. Add products before checking out.");
      router.push("/products");
    }
  }, [cart, cartError, router]);

  const activeAddressId = selectedAddressId || addresses[0]?.id || "";

  // Derive the active shipping method: use explicit user choice or fall back to the first available
  const selectedShippingMethod = selectedShippingMethodId || shippingMethods[0]?.id || "";
  const setSelectedShippingMethod = setSelectedShippingMethodId;

  useEffect(() => {
    const timer = setTimeout(() => {
      if (typeof window !== "undefined" && window.crypto?.randomUUID) {
        setIdempotencyKey(window.crypto.randomUUID());
      } else {
        setIdempotencyKey(Math.random().toString(36).substring(2) + Date.now().toString(36));
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const onSubmitAddress = async (data: AddressFormValues) => {
    try {
      const newAddress = (await api.createAddress(data)) as Address;
      toast.success("New address added successfully!");
      mutate('/addresses');
      setSelectedAddressId(newAddress.id);
      setShowAddressForm(false);
      reset();
    } catch {
      setError("root", { message: "Failed to save new address." });
    }
  };

  const handlePlaceOrder = async () => {
    if (!activeAddressId) {
      setCheckoutError("Please select or add a delivery address.");
      return;
    }

    if (!selectedShippingMethod) {
      setCheckoutError("Please select a shipping method.");
      return;
    }

    if (paymentGateway === "PAYSTACK") {
      try {
        setCheckoutError("");
        setSubmittingOrder(true);

        const order = (await api.createOrder(activeAddressId, selectedShippingMethod, {
          idempotencyKey,
          paymentGateway: "PAYSTACK",
        })) as { id: string };

        const payment = (await api.initializePayment(
          order.id,
          "PAYSTACK"
        )) as PaymentInitializeResponse;
        const authorizationUrl = payment.data?.authorizationUrl;

        if (!authorizationUrl) {
          throw new Error("Payment provider did not return a checkout URL");
        }

        toast.success("Redirecting to secure Paystack checkout...");
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("cart-updated"));
          window.location.assign(authorizationUrl);
        } else {
          router.push(`/checkout/success?orderId=${order.id}`);
        }
      } catch {
        setSubmittingOrder(false);
        setCheckoutError("Failed to initialize payment. Please try again or contact support.");
      }
      return;
    }

    setCheckoutError("Stripe checkout is not connected yet. Please choose Paystack.");
  };

  const subtotal = useMemo(() => {
    if (!cart) return 0;
    return cart.items.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0);
  }, [cart]);

  const selectedMethod = useMemo(() => {
    return shippingMethods.find(m => m.id === selectedShippingMethod);
  }, [shippingMethods, selectedShippingMethod]);

  const shipping = selectedMethod ? Number(selectedMethod.price) : 0;
  const total = subtotal + shipping;

  if (!mounted || loading) {
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

        {checkoutError ? (
          <div className="mb-6">
            <AlertBanner variant="error" message={checkoutError} />
          </div>
        ) : null}

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
                        className={`text-left p-4 rounded-xl border text-sm transition relative ${activeAddressId === address.id
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
                        {activeAddressId === address.id && (
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
                <form onSubmit={handleSubmit(onSubmitAddress)} className="space-y-4 border-t border-gray-100 pt-4">
                  {errors.root && <AlertBanner variant="error" message={errors.root.message} />}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="fullName" className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Recipient Full Name</label>
                      <input
                        id="fullName"
                        {...register("fullName")}
                        type="text"
                        autoComplete="name"
                        placeholder="John Doe"
                        className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm text-gray-900 focus:border-gray-950 focus:outline-none focus:ring-1 focus:ring-gray-950"
                      />
                      {errors.fullName && <span className="text-red-500 text-xs mt-1 block">{errors.fullName.message}</span>}
                    </div>
                    <div>
                      <label htmlFor="phone" className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Phone Number</label>
                      <input
                        id="phone"
                        {...register("phone")}
                        type="tel"
                        autoComplete="tel"
                        placeholder="+1 (555) 019-2834"
                        className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm text-gray-900 focus:border-gray-950 focus:outline-none focus:ring-1 focus:ring-gray-950"
                      />
                      {errors.phone && <span className="text-red-500 text-xs mt-1 block">{errors.phone.message}</span>}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="street" className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Street Address</label>
                    <input
                      id="street"
                      {...register("street")}
                      type="text"
                      autoComplete="street-address"
                      placeholder="123 Shopping Lane, Suite 4B"
                      className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm text-gray-900 focus:border-gray-950 focus:outline-none focus:ring-1 focus:ring-gray-950"
                    />
                    {errors.street && <span className="text-red-500 text-xs mt-1 block">{errors.street.message}</span>}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="city" className="block text-xs font-bold text-gray-700 uppercase mb-1.5">City</label>
                      <input
                        id="city"
                        {...register("city")}
                        type="text"
                        autoComplete="address-level2"
                        placeholder="New York"
                        className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm text-gray-900 focus:border-gray-950 focus:outline-none focus:ring-1 focus:ring-gray-950"
                      />
                      {errors.city && <span className="text-red-500 text-xs mt-1 block">{errors.city.message}</span>}
                    </div>
                    <div>
                      <label htmlFor="state" className="block text-xs font-bold text-gray-700 uppercase mb-1.5">State / Province</label>
                      <input
                        id="state"
                        {...register("state")}
                        type="text"
                        autoComplete="address-level1"
                        placeholder="NY"
                        className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm text-gray-900 focus:border-gray-950 focus:outline-none focus:ring-1 focus:ring-gray-950"
                      />
                      {errors.state && <span className="text-red-500 text-xs mt-1 block">{errors.state.message}</span>}
                    </div>
                    <div>
                      <label htmlFor="country" className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Country</label>
                      <select
                        id="country"
                        {...register("country")}
                        autoComplete="country-name"
                        className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm text-gray-900 focus:border-gray-950 focus:outline-none focus:ring-1 focus:ring-gray-950"
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
                    <LoadingButton
                      type="submit"
                      loading={isSubmitting}
                      className="rounded-md bg-gray-950 px-4 py-2 text-xs font-semibold text-white hover:bg-gray-800 transition disabled:opacity-50"
                    >
                      Save Address
                    </LoadingButton>
                  </div>
                </form>
              )}
            </div>

            {/* Shipping Method Selector */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-xs">
              <h3 className="text-lg font-bold text-gray-950 flex items-center gap-2 mb-4">
                <Truck className="h-5 w-5 text-gray-900" />
                Shipping Method
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {shippingMethods.length > 0 ? (
                  shippingMethods.map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setSelectedShippingMethod(method.id)}
                      className={`relative flex flex-col items-start p-4 rounded-xl border text-left transition-all hover:bg-gray-50 ${selectedShippingMethod === method.id
                        ? "border-gray-950 bg-gray-50/50 ring-1 ring-gray-950"
                        : "border-gray-200 bg-white"
                        }`}
                    >
                      <div className="flex items-center gap-2 w-full justify-between mb-2">
                        <span className="text-sm font-bold text-gray-950">{method.name}</span>
                        <div className={`h-4 w-4 rounded-full border flex items-center justify-center ${selectedShippingMethod === method.id ? "border-gray-950 bg-gray-950" : "border-gray-300"}`}>
                          {selectedShippingMethod === method.id && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                        </div>
                      </div>
                      <p className="text-xs font-semibold text-gray-900 mb-1">{currencyFormatter.format(Number(method.price))}</p>
                      {method.estimatedDays && <p className="text-[11px] text-gray-500 leading-relaxed">Est. delivery: {method.estimatedDays}</p>}
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No shipping methods available.</p>
                )}
              </div>
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
                  disabled
                  className="relative flex flex-col items-start p-4 rounded-xl border text-left border-gray-200 bg-gray-100 opacity-60 cursor-not-allowed"
                >
                  <div className="flex items-center gap-2 w-full justify-between mb-2">
                    <span className="text-sm font-bold text-gray-950">Stripe (Coming soon)</span>
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
                        <ProductImage
                          src={getAssetUrl(item.product.image) || item.product.image}
                          alt={item.product.name}
                          className="h-full w-full object-cover"
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
              <LoadingButton
                onClick={handlePlaceOrder}
                loading={submittingOrder}
                disabled={!activeAddressId}
                className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gray-950 py-3.5 text-sm font-semibold text-white transition hover:bg-gray-800 shadow-sm disabled:opacity-50"
              >
                Place Order Now
              </LoadingButton>
            </div>

          </aside>

        </div>

      </div>
    </main>
  );
}
