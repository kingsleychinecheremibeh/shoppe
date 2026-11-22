"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  ArrowRight02Icon,
  Call02Icon,
  Delete02Icon,
  Loading03Icon,
  Location01Icon,
  Logout03Icon,
  Mail01Icon,
  MessageMultiple01Icon,
  PackageIcon,
  ShoppingCart01Icon,
} from "@hugeicons/core-free-icons";
import { ConfirmModal, LoadingButton } from "@/app/components/feedback";
import { api } from "@/lib/api";
import { notifyCartUpdated, openCart } from "@/lib/cart-events";
import { ui } from "@/lib/ui";
import { useHydrated } from "@/app/hooks/use-hydrated";
import { toast } from "sonner";
import useSWR, { mutate } from "swr";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

type Address = {
  id: string;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  country: string;
};

type UserProfile = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
};

type MeResponse = {
  user: UserProfile;
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

export default function AccountPage() {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState<string | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const mounted = useHydrated();

  // 1. SWR Data Fetching (Replaces useEffect, loading state, and profile/address state!)
  const { data: profileData, isLoading: loadingProfile, error: profileError } = useSWR(
    '/auth/me',
    () => api.getMe(),
    {
      shouldRetryOnError: (err) => {
        if (err.message === "Please log in to continue.") return false;
        return true;
      }
    }
  );
  const { data: addressesData, isLoading: loadingAddresses } = useSWR('/addresses', () => api.getAddresses());

  const profile = (profileData as MeResponse)?.user;
  const addresses = (addressesData as Address[]) || [];
  const loading = loadingProfile || loadingAddresses;

  useEffect(() => {
    if (!profileError) return;

    toast.error("Please login to access your account dashboard.");
    router.push("/login");
  }, [profileError, router]);

  // 2. React Hook Form Setup (Replaces manual form state!)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: { country: "Nigeria" }
  });

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await api.logout().catch(() => undefined);
      toast.success("You're logged out.");
      notifyCartUpdated();
      router.push("/login");
    } finally {
      setLoggingOut(false);
    }
  };

  const onSubmitAddress = async (data: AddressFormValues) => {
    try {
      await api.createAddress(data);
      mutate('/addresses'); // Automatically refreshes the address list from the server!
      toast.success("Delivery address added successfully!");
      setShowAddressForm(false);
      reset(); // Clears the form
    } catch {
      toast.error("Failed to add new address. Please try again.");
    }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      await api.deleteAddress(id);
      mutate('/addresses'); // Refresh the list automatically
      toast.success("Address removed successfully.");
    } catch (error) {
      toast.error(error instanceof Error && error.message ? error.message : "Couldn't remove that address. Please try again.");
    }
  };

  if (!mounted || loading) {
    return (
      <main className="min-h-screen">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="h-14 w-64 animate-pulse rounded-md bg-canvas" />
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="h-56 animate-pulse rounded-lg border-[1.5px] border-gray-300 bg-canvas" />
            <div className="h-56 animate-pulse rounded-lg border-[1.5px] border-gray-300 bg-canvas lg:col-span-2" />
          </div>
        </div>
      </main>
    );
  }

  const joined = profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString("en-NG", { year: "numeric", month: "long" }) : null;

  const shortcuts = [
    { label: "My orders", hint: "Track and review orders", icon: PackageIcon, bg: "#2F5BFF", fg: "#FFFFFF", href: "/account/orders" },
    { label: "Your cart", hint: "Pick up where you left off", icon: ShoppingCart01Icon, bg: "#FF4FA3", fg: "#141414", onClick: () => openCart() },
    { label: "Help", hint: "Delivery, returns, payments", icon: MessageMultiple01Icon, bg: "#1FAF6E", fg: "#141414", href: "/contact" },
  ];

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-6xl leading-none font-extrabold tracking-[-0.045em] text-ink">Hi, {profile?.name?.split(" ")[0] || "there"}</h1>
            <p className="mt-3 text-base text-gray-700">Manage your orders and delivery addresses.</p>
          </div>
          <button type="button" onClick={handleLogout} disabled={loggingOut} className={`${ui.secondary} self-start sm:self-auto`}>
            <HugeiconsIcon icon={loggingOut ? Loading03Icon : Logout03Icon} size={22} strokeWidth={1.6} className={loggingOut ? "animate-spin" : ""} />
            Log out
          </button>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {shortcuts.map((item) => {
            const content = (
              <>
                <HugeiconsIcon icon={item.icon} size={52} strokeWidth={1.4} />
                <span className="flex items-end justify-between gap-3">
                  <span>
                    <span className="block font-display text-2xl leading-tight font-bold tracking-[-0.02em]">{item.label}</span>
                    <span className="block text-sm opacity-90">{item.hint}</span>
                  </span>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-[1.5px] border-ink bg-white text-ink">
                    <HugeiconsIcon icon={ArrowRight02Icon} size={22} strokeWidth={1.8} />
                  </span>
                </span>
              </>
            );
            const className = "sticker flex min-h-44 flex-col justify-between gap-6 rounded-lg border-[1.5px] border-ink p-5 text-left";
            const style = { background: item.bg, color: item.fg };
            return item.href ? (
              <Link key={item.label} href={item.href} className={className} style={style}>
                {content}
              </Link>
            ) : (
              <button key={item.label} type="button" onClick={item.onClick} className={className} style={style}>
                {content}
              </button>
            );
          })}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-start">
          <div className={`${ui.card} p-6`}>
            <div className="flex h-16 w-16 items-center justify-center rounded-lg border-[1.5px] border-ink bg-sun font-display text-3xl font-extrabold">
              {(profile?.name || "U").slice(0, 1).toUpperCase()}
            </div>
            <p className="mt-4 text-lg font-semibold text-ink">{profile?.name}</p>
            <p className="mt-1 flex items-center gap-2 truncate text-[15px] text-gray-700">
              <HugeiconsIcon icon={Mail01Icon} size={20} strokeWidth={1.6} className="shrink-0" />
              {profile?.email}
            </p>
            {joined && <p className="mt-3 font-mono text-xs text-gray-600">Member since {joined}</p>}
          </div>

          <section className={`${ui.card} p-6 lg:col-span-2`} aria-labelledby="addresses-title">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <h2 id="addresses-title" className="text-2xl font-extrabold text-ink">
                Delivery addresses
              </h2>
              {!showAddressForm && (
                <button type="button" onClick={() => setShowAddressForm(true)} className={`${ui.secondary} h-11 px-3`}>
                  <HugeiconsIcon icon={Add01Icon} size={20} strokeWidth={1.8} />
                  Add address
                </button>
              )}
            </div>

            {showAddressForm && (
              <form onSubmit={handleSubmit(onSubmitAddress)} className="mb-6 space-y-4 rounded-lg bg-sun-soft p-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="fullName" className={ui.label}>Full name</label>
                    <input id="fullName" {...register("fullName")} type="text" autoComplete="name" className={ui.input} />
                    {errors.fullName && <span className={ui.fieldError}>{errors.fullName.message}</span>}
                  </div>
                  <div>
                    <label htmlFor="phone" className={ui.label}>Phone number</label>
                    <input id="phone" {...register("phone")} type="tel" autoComplete="tel" className={ui.input} />
                    {errors.phone && <span className={ui.fieldError}>{errors.phone.message}</span>}
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="street" className={ui.label}>Street address</label>
                    <input id="street" {...register("street")} type="text" autoComplete="street-address" className={ui.input} />
                    {errors.street && <span className={ui.fieldError}>{errors.street.message}</span>}
                  </div>
                  <div>
                    <label htmlFor="city" className={ui.label}>City</label>
                    <input id="city" {...register("city")} type="text" autoComplete="address-level2" className={ui.input} />
                    {errors.city && <span className={ui.fieldError}>{errors.city.message}</span>}
                  </div>
                  <div>
                    <label htmlFor="state" className={ui.label}>State</label>
                    <input id="state" {...register("state")} type="text" autoComplete="address-level1" className={ui.input} />
                    {errors.state && <span className={ui.fieldError}>{errors.state.message}</span>}
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setShowAddressForm(false)} className="h-12 rounded-lg px-5 text-[15px] font-semibold text-ink hover:bg-white">
                    Cancel
                  </button>
                  <LoadingButton type="submit" loading={isSubmitting} className={ui.primary}>
                    Save address
                  </LoadingButton>
                </div>
              </form>
            )}

            {addresses.length === 0 ? (
              !showAddressForm && (
                <div className="flex flex-col items-center rounded-lg border-[1.5px] border-dashed border-ink px-6 py-10 text-center">
                  <span className="flex h-16 w-16 items-center justify-center rounded-lg border-[1.5px] border-ink bg-sun">
                    <HugeiconsIcon icon={Location01Icon} size={36} strokeWidth={1.5} />
                  </span>
                  <p className="mt-3 text-lg font-semibold text-ink">No saved addresses yet</p>
                  <p className="mt-1 text-[15px] text-gray-700">Add one now and checkout will be quicker.</p>
                </div>
              )
            ) : (
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {addresses.map((address) => (
                  <li key={address.id} className="rounded-lg border-[1.5px] border-ink p-4 text-[15px]">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-semibold text-ink">{address.fullName}</p>
                      <button
                        type="button"
                        onClick={() => setAddressToDelete(address.id)}
                        aria-label={`Delete address for ${address.fullName}`}
                        className="-m-2 flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 transition hover:bg-red-50 hover:text-danger"
                      >
                        <HugeiconsIcon icon={Delete02Icon} size={22} strokeWidth={1.6} />
                      </button>
                    </div>
                    <p className="mt-1 text-gray-700">{address.street}</p>
                    <p className="text-gray-700">
                      {address.city}, {address.state}
                    </p>
                    <p className="mt-2 flex items-center gap-2 font-mono text-sm text-gray-600">
                      <HugeiconsIcon icon={Call02Icon} size={18} strokeWidth={1.6} />
                      {address.phone}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
      <ConfirmModal
        open={Boolean(addressToDelete)}
        title="Delete address?"
        message="This delivery address will be removed from your account."
        confirmLabel="Delete"
        onClose={() => setAddressToDelete(null)}
        onConfirm={() => {
          if (!addressToDelete) return;
          const id = addressToDelete;
          setAddressToDelete(null);
          void handleDeleteAddress(id);
        }}
      />
    </main>
  );
}
