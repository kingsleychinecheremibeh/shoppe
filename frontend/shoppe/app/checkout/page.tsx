"use client";

import { useEffect, useState, useMemo, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  Alert02Icon,
  ArrowLeft02Icon,
  CreditCardIcon,
  Location01Icon,
  LockIcon,
  Mail01Icon,
  Tick02Icon,
  WhatsappIcon,
} from "@hugeicons/core-free-icons";
import Link from "next/link";
import { toast } from "sonner";
import { AlertBanner, LoadingButton } from "@/app/components/feedback";
import { ProductImage } from "@/app/components/product-image";
import { api, getAssetUrl } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { notifyCartUpdated } from "@/lib/cart-events";
import { storeConfig } from "@/lib/store-config";
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
  images?: { id: string; url: string; isPrimary: boolean }[];
};

type CartItem = {
  id: string;
  productId: string;
  quantity: number;
  productImageId?: string | null;
  product: Product;
};

const cartItemImage = (item: CartItem) =>
  item.product.images?.find((image) => image.id === item.productImageId)?.url ||
  item.product.images?.find((image) => image.isPrimary)?.url ||
  item.product.images?.[0]?.url ||
  item.product.image;

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
  "h-12 w-full rounded-lg border-[1.5px] border-ink bg-white px-3.5 text-[15px] text-ink placeholder:text-gray-500 outline-none transition focus:shadow-sticker-sm";
const labelClass = "mb-1.5 block text-sm font-semibold text-ink";
const errorClass = "mt-1.5 block text-sm font-medium text-danger";
const optionClass = (selected: boolean) =>
  `relative w-full rounded-lg border-[1.5px] border-ink p-4 text-left text-[15px] transition ${
    selected ? "bg-sun-soft shadow-sticker-sm -translate-x-px -translate-y-px" : "bg-white hover:bg-gray-50"
  }`;
const Radio = ({ checked }: { checked: boolean }) => (
  <span
    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-[1.5px] border-ink ${checked ? "bg-ink text-paper" : "bg-white"}`}
    aria-hidden="true"
  >
    {checked && <HugeiconsIcon icon={Tick02Icon} size={16} strokeWidth={2.4} />}
  </span>
);
const StepTitle = ({ step, title, done, action, id }: { step: number; title: string; done?: boolean; action?: ReactNode; id?: string }) => (
  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
    <h2 id={id} className="flex items-center gap-3 text-xl font-extrabold text-ink sm:text-2xl">
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-md border-[1.5px] border-ink font-mono text-base font-semibold ${
          done ? "bg-leaf text-ink" : "bg-ink text-paper"
        }`}
        aria-hidden="true"
      >
        {done ? <HugeiconsIcon icon={Tick02Icon} size={20} strokeWidth={2.4} /> : step}
      </span>
      {title}
      {done && <span className="sr-only">(done)</span>}
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
          notifyCartUpdated();
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
      <main className="min-h-screen">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="h-14 w-56 animate-pulse rounded-md bg-canvas" />
          <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_400px]">
            <div className="space-y-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-40 animate-pulse rounded-lg border-[1.5px] border-gray-300 bg-canvas" />
              ))}
            </div>
            <div className="h-80 animate-pulse rounded-lg border-[1.5px] border-gray-300 bg-canvas" />
          </div>
        </div>
      </main>
    );
  }

  // Tell the shopper exactly what is stopping them from paying.
  const noDeliveryOptions = shippingMethods.length === 0;
  const missing: { message: string; target: string; buttonLabel: string } | null = !activeAddressId
    ? { message: "Add a delivery address.", target: "#step-address", buttonLabel: "Add an address to pay" }
    : noDeliveryOptions
      ? { message: "Delivery isn't set up yet — contact us and we'll complete your order.", target: "#step-delivery", buttonLabel: "Delivery unavailable" }
      : !selectedShippingMethod
        ? { message: "Choose a delivery option.", target: "#step-delivery", buttonLabel: "Choose delivery to pay" }
        : null;
  const whatsappDigits = storeConfig.whatsappNumber.replace(/\D/g, "");

  return (
    <main className="min-h-screen pb-32 lg:pb-0">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <Link href="/cart" className="mb-4 inline-flex items-center gap-2 text-[15px] font-semibold underline-offset-4 hover:underline">
          <HugeiconsIcon icon={ArrowLeft02Icon} size={22} strokeWidth={1.8} />
          Back to cart
        </Link>
        <h1 className="text-6xl leading-none font-extrabold tracking-[-0.045em] text-ink">Checkout</h1>

        {checkoutError ? (
          <div className="mt-6">
            <AlertBanner variant="error" message={checkoutError} />
          </div>
        ) : null}

        <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start">
          <div className="min-w-0 space-y-10">
            {/* 1. Address */}
            <section aria-labelledby="step-address" className="scroll-mt-36">
              <StepTitle
                id="step-address"
                step={1}
                title="Delivery address"
                done={Boolean(activeAddressId) && !showAddressForm}
                action={
                  !showAddressForm && addresses.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => setShowAddressForm(true)}
                      className="inline-flex h-11 items-center gap-1.5 rounded-lg border-[1.5px] border-ink bg-white px-3 text-[15px] font-semibold transition hover:bg-sun"
                    >
                      <HugeiconsIcon icon={Add01Icon} size={20} strokeWidth={1.8} />
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
                              <p className="font-semibold text-ink">{address.fullName}</p>
                              <p className="mt-1 text-gray-700">{address.street}</p>
                              <p className="text-gray-700">
                                {address.city}, {address.state}
                              </p>
                              <p className="mt-1 font-mono text-sm text-gray-600">{address.phone}</p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center rounded-lg border-[1.5px] border-dashed border-ink p-8 text-center">
                    <span className="flex h-16 w-16 items-center justify-center rounded-lg border-[1.5px] border-ink bg-sun">
                      <HugeiconsIcon icon={Location01Icon} size={36} strokeWidth={1.5} aria-hidden="true" />
                    </span>
                    <p className="mt-3 text-base text-gray-700">Where should we deliver your order?</p>
                    <button
                      type="button"
                      onClick={() => setShowAddressForm(true)}
                      className="mt-4 inline-flex h-12 items-center gap-2 rounded-lg bg-ink px-5 text-[15px] font-semibold text-paper transition hover:bg-black"
                    >
                      <HugeiconsIcon icon={Add01Icon} size={22} strokeWidth={1.8} />
                      Add address
                    </button>
                  </div>
                ))}

              {showAddressForm && (
                <form onSubmit={handleSubmit(onSubmitAddress)} className="space-y-4 rounded-lg border-[1.5px] border-ink bg-white p-5">
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
                        className="h-12 rounded-lg px-5 text-[15px] font-semibold text-ink transition hover:bg-gray-100"
                      >
                        Cancel
                      </button>
                    )}
                    <LoadingButton
                      type="submit"
                      loading={isSubmitting}
                      className="h-12 rounded-lg bg-ink px-5 text-[15px] font-semibold text-paper transition hover:bg-black"
                    >
                      Save address
                    </LoadingButton>
                  </div>
                </form>
              )}
            </section>

            {/* 2. Delivery */}
            <section aria-labelledby="step-delivery" className="scroll-mt-36">
              <StepTitle id="step-delivery" step={2} title="Delivery speed" done={Boolean(selectedMethod)} />
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
                              <p className="font-semibold text-ink">{method.name}</p>
                              {method.estimatedDays && <p className="mt-0.5 text-gray-600">{method.estimatedDays}</p>}
                              {method.description && <p className="mt-0.5 text-sm text-gray-600">{method.description}</p>}
                            </div>
                            <p className="price-tag shrink-0 text-ink">{Number(method.price) === 0 ? "Free" : formatPrice(method.price)}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-lg border-[1.5px] border-ink bg-sun-soft p-5">
                  <p className="flex items-start gap-3 text-[15px] text-ink">
                    <HugeiconsIcon icon={Alert02Icon} size={24} strokeWidth={1.7} className="shrink-0" />
                    Delivery options aren&apos;t set up right now. Message us and we&apos;ll arrange delivery and complete your order.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <a
                      href={`https://wa.me/${whatsappDigits}?text=${encodeURIComponent("Hi, I'd like to complete my Shoppe order.")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-11 items-center gap-2 rounded-lg bg-ink px-4 text-[15px] font-semibold text-paper hover:bg-black"
                    >
                      <HugeiconsIcon icon={WhatsappIcon} size={22} strokeWidth={1.6} />
                      WhatsApp us
                    </a>
                    <a
                      href={`mailto:${storeConfig.supportEmail}?subject=${encodeURIComponent("Complete my order")}`}
                      className="inline-flex h-11 items-center gap-2 rounded-lg border-[1.5px] border-ink bg-white px-4 text-[15px] font-semibold hover:bg-gray-50"
                    >
                      <HugeiconsIcon icon={Mail01Icon} size={22} strokeWidth={1.6} />
                      Email us
                    </a>
                  </div>
                </div>
              )}
            </section>

            {/* 3. Payment */}
            <section aria-labelledby="step-payment">
              <StepTitle id="step-payment" step={3} title="Payment" />
              <div className={optionClass(paymentGateway === "PAYSTACK")}>
                <div className="flex items-center gap-3">
                  <Radio checked={paymentGateway === "PAYSTACK"} />
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border-[1.5px] border-ink bg-pink">
                    <HugeiconsIcon icon={CreditCardIcon} size={26} strokeWidth={1.5} />
                  </span>
                  <div>
                    <p className="font-semibold text-ink">Pay with Paystack</p>
                    <p className="mt-0.5 text-gray-700">Card, bank transfer or USSD. You&apos;ll finish payment on Paystack.</p>
                  </div>
                </div>
              </div>
              <p className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                <HugeiconsIcon icon={LockIcon} size={20} strokeWidth={1.6} aria-hidden="true" />
                We never see or store your card details.{" "}
                <Link href="/secure-checkout" className="font-medium text-ink underline underline-offset-2">
                  Learn more
                </Link>
              </p>
            </section>
          </div>

          {/* Summary */}
          <aside className="rounded-lg border-[1.5px] border-ink bg-white p-6 shadow-sticker lg:sticky lg:top-32">
            <h2 className="text-2xl font-extrabold text-ink">Order summary</h2>

            <ul className="mt-5 max-h-72 space-y-4 overflow-y-auto pt-1 pr-1">
              {cart?.items.map((item) => {
                const url = cartItemImage(item);
                return (
                  <li key={item.id} className="flex items-center gap-3 text-[15px]">
                    <div className="relative h-16 w-14 shrink-0 rounded-md border-[1.5px] border-ink bg-canvas">
                      <div className="absolute inset-0 overflow-hidden rounded-[5px]">
                        {url ? (
                          <ProductImage src={getAssetUrl(url) || url} alt={item.product.name} fill className="object-cover mix-blend-multiply" sizes="56px" />
                        ) : null}
                      </div>
                      <span className="absolute -top-2 -right-2 flex h-6 min-w-6 items-center justify-center rounded-md border-[1.5px] border-ink bg-sun px-1 font-mono text-xs font-semibold">
                        {item.quantity}
                      </span>
                    </div>
                    <p className="min-w-0 flex-1 truncate text-ink">{item.product.name}</p>
                    <span className="shrink-0 font-mono font-semibold text-ink">{formatPrice(Number(item.product.price) * item.quantity)}</span>
                  </li>
                );
              })}
            </ul>

            <dl className="mt-6 space-y-3 border-t-[1.5px] border-ink pt-5 text-[15px]">
              <div className="flex justify-between">
                <dt className="text-gray-700">Subtotal</dt>
                <dd className="font-mono font-semibold text-ink">{formatPrice(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-700">Delivery</dt>
                <dd className="font-mono font-semibold text-ink">
                  {selectedMethod ? (shipping === 0 ? "Free" : formatPrice(shipping)) : <span className="font-sans font-normal text-gray-600">Not chosen yet</span>}
                </dd>
              </div>
            </dl>
            <div className="mt-5 flex items-baseline justify-between border-t-[1.5px] border-ink pt-5">
              <span className="text-base font-semibold text-ink">Total</span>
              <span className="price-tag text-3xl text-ink">{formatPrice(total)}</span>
            </div>

            <LoadingButton
              onClick={handlePlaceOrder}
              loading={submittingOrder}
              disabled={Boolean(missing)}
              aria-describedby={missing ? "checkout-missing" : undefined}
              className="mt-6 h-14 w-full rounded-lg bg-ink text-base font-semibold text-paper transition hover:bg-black"
            >
              {missing ? missing.buttonLabel : `Pay ${formatPrice(total)}`}
            </LoadingButton>
            {missing && (
              <p id="checkout-missing" className="mt-3 flex items-start gap-2 rounded-lg bg-sun-soft px-3 py-2.5 text-sm text-ink">
                <HugeiconsIcon icon={Alert02Icon} size={20} strokeWidth={1.7} className="mt-px shrink-0" />
                <span>
                  Before you pay:{" "}
                  <a href={missing.target} className="font-semibold underline underline-offset-2">
                    {missing.message}
                  </a>
                </span>
              </p>
            )}
            <p className="mt-3 text-center text-sm leading-6 text-gray-600">
              By paying you agree to our{" "}
              <Link href="/terms" className="underline underline-offset-2 hover:text-ink">Terms</Link>,{" "}
              <Link href="/privacy-policy" className="underline underline-offset-2 hover:text-ink">Privacy</Link> and{" "}
              <Link href="/refund-policy" className="underline underline-offset-2 hover:text-ink">Refund</Link> policies.
            </p>
          </aside>
        </div>
      </div>

      {/* Mobile: keep the total and Pay button in reach while filling in the steps */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t-[1.5px] border-ink bg-paper px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] lg:hidden">
        <div className="mx-auto flex max-w-6xl items-center gap-4">
          <div className="min-w-0">
            <p className="text-sm text-gray-600">{selectedMethod ? "Total" : "Subtotal"}</p>
            <p className="price-tag text-xl text-ink">{formatPrice(selectedMethod ? total : subtotal)}</p>
          </div>
          {missing ? (
            <a
              href={missing.target}
              className="inline-flex h-12 flex-1 items-center justify-center rounded-lg border-[1.5px] border-ink bg-sun px-3 text-center text-[15px] font-semibold text-ink"
            >
              {missing.buttonLabel}
            </a>
          ) : (
            <LoadingButton
              onClick={handlePlaceOrder}
              loading={submittingOrder}
              className="h-12 flex-1 rounded-lg bg-ink text-[15px] font-semibold text-paper transition hover:bg-black"
            >
              Pay now
            </LoadingButton>
          )}
        </div>
      </div>
    </main>
  );
}
