"use client";

import { useEffect, useState, useMemo, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Plus, ArrowLeft, Lock } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { AlertBanner, LoadingButton } from "@/app/components/feedback";
import { ProductImage } from "@/app/components/product-image";
import { api, getAssetUrl } from "@/lib/api";
import { formatPrice } from "@/lib/format";
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
  phone: z.string().trim().min(7, "Enter a valid phone number").max(20, "Enter a valid phone number"),
  street: z.string().min(5, "Street address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  country: z.string(),
});

type AddressFormValues = z.infer<typeof addressSchema>;

const inputClass =
  "h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-gray-400 focus:ring-4 focus:ring-brand/10";
const labelClass = "mb-1.5 block text-sm font-medium text-gray-700";
const errorClass = "mt-1 block text-xs text-red-600";
const optionClass = (selected: boolean) =>
  `relative w-full rounded-2xl border p-4 text-left text-sm transition ${
    selected ? "border-gray-950 ring-1 ring-gray-950" : "border-gray-200 hover:border-gray-400"
  }`;
const Radio = ({ checked }: { checked: boolean }) => (
  <span
    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
      checked ? "border-brand bg-brand" : "border-gray-300"
    }`}
    aria-hidden="true"
  >
    {checked && <span className="h-2 w-2 rounded-full bg-white" />}
  </span>
);
const StepTitle = ({ step, title, action }: { step: number; title: string; action?: ReactNode }) => (
  <div className="mb-5 flex items-center justify-between gap-4">
    <h2 className="flex items-center gap-3 text-base font-semibold text-gray-950">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-950 text-xs font-medium text-white">
        {step}
      </span>
      {title}
    </h2>
    {action}
  </div>
);


export default function CheckoutPage() {
  const router = useRouter();

  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [paymentGateway] = useState<"STRIPE" | "PAYSTACK">("PAYSTACK");
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
    defaultValues: { country: "Nigeria" }
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
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="h-9 w-40 animate-pulse rounded bg-gray-100" />
          <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px]">
            <div className="space-y-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-40 animate-pulse rounded-2xl bg-gray-100" />
              ))}
            </div>
            <div className="h-80 animate-pulse rounded-2xl bg-gray-100" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white pb-28 lg:pb-0">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <Link
          href="/cart"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 transition hover:text-gray-950"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to cart
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight text-gray-950 sm:text-4xl">Checkout</h1>

        {checkoutError ? (
          <div className="mt-6">
            <AlertBanner variant="error" message={checkoutError} />
          </div>
        ) : null}

        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px] lg:items-start">
          <div className="space-y-10">
            {/* 1. Address */}
            <section>
              <StepTitle
                step={1}
                title="Delivery address"
                action={
                  !showAddressForm && addresses.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => setShowAddressForm(true)}
                      className="inline-flex items-center gap-1 text-sm font-medium text-brand transition hover:text-brand-hover"
                    >
                      <Plus className="h-4 w-4" />
                      New address
                    </button>
                  ) : null
                }
              />

              {!showAddressForm &&
                (addresses.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {addresses.map((address) => {
                      const selected = activeAddressId === address.id;
                      return (
                        <button
                          type="button"
                          key={address.id}
                          onClick={() => setSelectedAddressId(address.id)}
                          aria-pressed={selected}
                          className={optionClass(selected)}
                        >
                          <div className="flex gap-3">
                            <Radio checked={selected} />
                            <div className="min-w-0">
                              <p className="font-medium text-gray-950">{address.fullName}</p>
                              <p className="mt-1 text-gray-600">{address.street}</p>
                              <p className="text-gray-600">
                                {address.city}, {address.state}
                              </p>
                              <p className="mt-1 text-gray-500">{address.phone}</p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-2xl bg-canvas p-8 text-center">
                    <MapPin className="mx-auto h-6 w-6 text-gray-400" aria-hidden="true" />
                    <p className="mt-2 text-sm text-gray-600">Add where you want your order delivered.</p>
                    <button
                      type="button"
                      onClick={() => setShowAddressForm(true)}
                      className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-gray-950 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
                    >
                      <Plus className="h-4 w-4" />
                      Add address
                    </button>
                  </div>
                ))}

              {showAddressForm && (
                <form onSubmit={handleSubmit(onSubmitAddress)} className="space-y-4 rounded-2xl border border-gray-200 p-5">
                  {errors.root && <AlertBanner variant="error" message={errors.root.message} />}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="fullName" className={labelClass}>Full name</label>
                      <input id="fullName" {...register("fullName")} type="text" autoComplete="name" className={inputClass} />
                      {errors.fullName && <span className={errorClass}>{errors.fullName.message}</span>}
                    </div>
                    <div>
                      <label htmlFor="phone" className={labelClass}>Phone number</label>
                      <input id="phone" {...register("phone")} type="tel" autoComplete="tel" placeholder="0812 345 6789" className={inputClass} />
                      {errors.phone && <span className={errorClass}>{errors.phone.message}</span>}
                    </div>
                  </div>
                  <div>
                    <label htmlFor="street" className={labelClass}>Street address</label>
                    <input id="street" {...register("street")} type="text" autoComplete="street-address" className={inputClass} />
                    {errors.street && <span className={errorClass}>{errors.street.message}</span>}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <label htmlFor="city" className={labelClass}>City</label>
                      <input id="city" {...register("city")} type="text" autoComplete="address-level2" className={inputClass} />
                      {errors.city && <span className={errorClass}>{errors.city.message}</span>}
                    </div>
                    <div>
                      <label htmlFor="state" className={labelClass}>State</label>
                      <input id="state" {...register("state")} type="text" autoComplete="address-level1" className={inputClass} />
                      {errors.state && <span className={errorClass}>{errors.state.message}</span>}
                    </div>
                    <div>
                      <label htmlFor="country" className={labelClass}>Country</label>
                      <select id="country" {...register("country")} autoComplete="country-name" className={inputClass}>
                        <option value="Nigeria">Nigeria</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    {addresses.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowAddressForm(false)}
                        className="rounded-full px-5 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-100"
                      >
                        Cancel
                      </button>
                    )}
                    <LoadingButton
                      type="submit"
                      loading={isSubmitting}
                      className="rounded-full bg-gray-950 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:opacity-60"
                    >
                      Save address
                    </LoadingButton>
                  </div>
                </form>
              )}
            </section>

            {/* 2. Shipping */}
            <section>
              <StepTitle step={2} title="Delivery speed" />
              {shippingMethods.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {shippingMethods.map((method) => {
                    const selected = selectedShippingMethod === method.id;
                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setSelectedShippingMethod(method.id)}
                        aria-pressed={selected}
                        className={optionClass(selected)}
                      >
                        <div className="flex gap-3">
                          <Radio checked={selected} />
                          <div className="flex min-w-0 flex-1 justify-between gap-3">
                            <div>
                              <p className="font-medium text-gray-950">{method.name}</p>
                              {method.estimatedDays && <p className="mt-0.5 text-gray-500">{method.estimatedDays}</p>}
                            </div>
                            <p className="shrink-0 font-medium text-gray-950">
                              {Number(method.price) === 0 ? "Free" : formatPrice(method.price)}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="rounded-2xl bg-canvas p-5 text-sm text-gray-600">
                  Delivery options are not available right now. Please contact us to complete your order.
                </p>
              )}
            </section>

            {/* 3. Payment */}
            <section>
              <StepTitle step={3} title="Payment" />
              <div className={optionClass(paymentGateway === "PAYSTACK")}>
                <div className="flex gap-3">
                  <Radio checked={paymentGateway === "PAYSTACK"} />
                  <div>
                    <p className="font-medium text-gray-950">Pay with Paystack</p>
                    <p className="mt-0.5 text-gray-500">Card, bank transfer or USSD. You&apos;ll finish payment on Paystack.</p>
                  </div>
                </div>
              </div>
              <p className="mt-3 flex items-center gap-1.5 text-xs text-gray-500">
                <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                We never see or store your card details.{" "}
                <Link href="/secure-checkout" className="underline underline-offset-2 hover:text-gray-950">
                  Learn more
                </Link>
              </p>
            </section>
          </div>

          {/* Summary */}
          <aside className="rounded-2xl bg-canvas p-6 lg:sticky lg:top-24">
            <h2 className="text-base font-semibold text-gray-950">Order summary</h2>

            <ul className="mt-5 max-h-72 space-y-4 overflow-y-auto">
              {cart?.items.map((item) => (
                <li key={item.id} className="flex gap-3 text-sm">
                  <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-white">
                    {item.product.image ? (
                      <ProductImage
                        src={getAssetUrl(item.product.image) || item.product.image}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    ) : null}
                    <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-gray-950 px-1 text-[10px] font-medium text-white">
                      {item.quantity}
                    </span>
                  </div>
                  <p className="min-w-0 flex-1 truncate pt-0.5 text-gray-900">{item.product.name}</p>
                  <span className="shrink-0 pt-0.5 font-medium text-gray-950">
                    {formatPrice(Number(item.product.price) * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>

            <dl className="mt-6 space-y-3 border-t border-gray-200 pt-5 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-600">Subtotal</dt>
                <dd className="font-medium text-gray-950">{formatPrice(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Shipping</dt>
                <dd className="font-medium text-gray-950">
                  {selectedMethod ? (shipping === 0 ? "Free" : formatPrice(shipping)) : "—"}
                </dd>
              </div>
            </dl>
            <div className="mt-5 flex items-baseline justify-between border-t border-gray-200 pt-5">
              <span className="text-sm font-medium text-gray-950">Total</span>
              <span className="text-xl font-semibold text-gray-950">{formatPrice(total)}</span>
            </div>

            <LoadingButton
              onClick={handlePlaceOrder}
              loading={submittingOrder}
              disabled={!activeAddressId || !selectedShippingMethod}
              className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand text-sm font-medium text-white transition hover:bg-brand-hover disabled:opacity-50"
            >
              Pay {formatPrice(total)}
            </LoadingButton>
            <p className="mt-3 text-center text-xs leading-5 text-gray-500">
              By paying you agree to our{" "}
              <Link href="/terms" className="underline underline-offset-2 hover:text-gray-950">Terms</Link>,{" "}
              <Link href="/privacy-policy" className="underline underline-offset-2 hover:text-gray-950">Privacy</Link> and{" "}
              <Link href="/refund-policy" className="underline underline-offset-2 hover:text-gray-950">Refund</Link> policies.
            </p>
          </aside>
        </div>
      </div>

      {/* Mobile: keep the total and Pay button in reach while filling in the steps */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-6xl items-center gap-4">
          <div className="min-w-0">
            <p className="text-xs text-gray-500">{selectedMethod ? "Total" : "Subtotal"}</p>
            <p className="text-lg font-semibold text-gray-950">{formatPrice(selectedMethod ? total : subtotal)}</p>
          </div>
          <LoadingButton
            onClick={handlePlaceOrder}
            loading={submittingOrder}
            disabled={!activeAddressId || !selectedShippingMethod}
            className="inline-flex h-12 flex-1 items-center justify-center rounded-full bg-brand text-sm font-medium text-white transition hover:bg-brand-hover disabled:opacity-50"
          >
            {!activeAddressId ? "Add an address to pay" : "Pay now"}
          </LoadingButton>
        </div>
      </div>
    </main>
  );
}
