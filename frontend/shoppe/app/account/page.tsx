"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapPin, ShoppingBag, LogOut, Plus, Trash2, Loader2, Mail, ArrowRight, Phone } from "lucide-react";
import { ConfirmModal, LoadingButton } from "@/app/components/feedback";
import { api } from "@/lib/api";
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
      window.dispatchEvent(new Event("cart-updated"));
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
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="h-9 w-48 animate-pulse rounded bg-gray-100" />
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            <div className="h-48 animate-pulse rounded-2xl bg-gray-100" />
            <div className="h-48 animate-pulse rounded-2xl bg-gray-100 lg:col-span-2" />
          </div>
        </div>
      </main>
    );
  }

  const joined = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("en-NG", { year: "numeric", month: "long" })
    : null;

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-gray-950 sm:text-4xl">
              Hi, {profile?.name?.split(" ")[0] || "there"}
            </h1>
            <p className="mt-2 text-sm text-gray-500">Manage your orders and delivery addresses.</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="inline-flex items-center gap-1.5 self-start rounded-full px-4 py-2 text-sm font-medium text-gray-600 ring-1 ring-gray-200 transition hover:text-gray-950 hover:ring-gray-400 disabled:opacity-60 sm:self-auto"
          >
            {loggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
            Log out
          </button>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3 lg:items-start">
          {/* Profile + orders */}
          <div className="space-y-4">
            <div className="rounded-2xl bg-canvas p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand text-base font-medium text-white">
                {(profile?.name || "U").slice(0, 1).toUpperCase()}
              </div>
              <p className="mt-4 font-medium text-gray-950">{profile?.name}</p>
              <p className="mt-0.5 flex items-center gap-1.5 truncate text-sm text-gray-500">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                {profile?.email}
              </p>
              {joined && <p className="mt-3 text-xs text-gray-400">Member since {joined}</p>}
            </div>

            <Link
              href="/account/orders"
              className="group flex items-center justify-between rounded-2xl border border-gray-200 p-5 transition hover:border-gray-400"
            >
              <span className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft text-brand">
                  <ShoppingBag className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-sm font-medium text-gray-950">My orders</span>
                  <span className="block text-sm text-gray-500">Track and review orders</span>
                </span>
              </span>
              <ArrowRight className="h-4 w-4 text-gray-400 transition group-hover:translate-x-0.5 group-hover:text-gray-950" />
            </Link>
          </div>

          {/* Addresses */}
          <section className="rounded-2xl border border-gray-200 p-6 lg:col-span-2">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-950">Delivery addresses</h2>
              {!showAddressForm && (
                <button
                  type="button"
                  onClick={() => setShowAddressForm(true)}
                  className="inline-flex items-center gap-1 text-sm font-medium text-brand transition hover:text-brand-hover"
                >
                  <Plus className="h-4 w-4" />
                  Add address
                </button>
              )}
            </div>

            {showAddressForm && (
              <form onSubmit={handleSubmit(onSubmitAddress)} className="mb-6 space-y-4 rounded-2xl bg-canvas p-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="fullName" className="mb-1.5 block text-sm font-medium text-gray-700">Full name</label>
                    <input id="fullName" {...register("fullName")} type="text" autoComplete="name" className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-950 placeholder-gray-400 outline-none transition focus:border-gray-400 focus:ring-4 focus:ring-brand/10" />
                    {errors.fullName && <span className="mt-1 block text-xs text-red-600">{errors.fullName.message}</span>}
                  </div>
                  <div>
                    <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-gray-700">Phone number</label>
                    <input id="phone" {...register("phone")} type="tel" autoComplete="tel" className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-950 placeholder-gray-400 outline-none transition focus:border-gray-400 focus:ring-4 focus:ring-brand/10" />
                    {errors.phone && <span className="mt-1 block text-xs text-red-600">{errors.phone.message}</span>}
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="street" className="mb-1.5 block text-sm font-medium text-gray-700">Street address</label>
                    <input id="street" {...register("street")} type="text" autoComplete="street-address" className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-950 placeholder-gray-400 outline-none transition focus:border-gray-400 focus:ring-4 focus:ring-brand/10" />
                    {errors.street && <span className="mt-1 block text-xs text-red-600">{errors.street.message}</span>}
                  </div>
                  <div>
                    <label htmlFor="city" className="mb-1.5 block text-sm font-medium text-gray-700">City</label>
                    <input id="city" {...register("city")} type="text" autoComplete="address-level2" className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-950 placeholder-gray-400 outline-none transition focus:border-gray-400 focus:ring-4 focus:ring-brand/10" />
                    {errors.city && <span className="mt-1 block text-xs text-red-600">{errors.city.message}</span>}
                  </div>
                  <div>
                    <label htmlFor="state" className="mb-1.5 block text-sm font-medium text-gray-700">State</label>
                    <input id="state" {...register("state")} type="text" autoComplete="address-level1" className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-950 placeholder-gray-400 outline-none transition focus:border-gray-400 focus:ring-4 focus:ring-brand/10" />
                    {errors.state && <span className="mt-1 block text-xs text-red-600">{errors.state.message}</span>}
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddressForm(false)}
                    className="rounded-full px-5 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-white"
                  >
                    Cancel
                  </button>
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

            {addresses.length === 0 ? (
              !showAddressForm && (
                <div className="rounded-2xl bg-canvas px-6 py-10 text-center">
                  <MapPin className="mx-auto h-6 w-6 text-gray-400" />
                  <p className="mt-2 text-sm font-medium text-gray-900">No saved addresses yet</p>
                  <p className="mt-1 text-sm text-gray-500">Add one now and checkout will be quicker.</p>
                </div>
              )
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {addresses.map((address) => (
                  <li key={address.id} className="rounded-2xl border border-gray-100 p-4 text-sm">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-medium text-gray-950">{address.fullName}</p>
                      <button
                        type="button"
                        onClick={() => setAddressToDelete(address.id)}
                        aria-label={`Delete address for ${address.fullName}`}
                        className="-m-1 rounded-full p-1 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="mt-1 text-gray-600">{address.street}</p>
                    <p className="text-gray-600">
                      {address.city}, {address.state}
                    </p>
                    <p className="mt-2 flex items-center gap-1.5 text-gray-500">
                      <Phone className="h-3.5 w-3.5" />
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
