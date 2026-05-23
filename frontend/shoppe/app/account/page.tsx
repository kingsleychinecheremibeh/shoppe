"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MapPin,
  ShoppingBag,
  LogOut,
  Plus,
  Trash2,
  Loader2,
  Mail,
  Shield,
  ArrowRight,
  Sparkles,
  Phone,
  Home
} from "lucide-react";
import { ConfirmModal, LoadingButton } from "@/app/components/feedback";
import { api } from "@/lib/api";
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
  phone: z.string().min(5, "Valid phone number is required"),
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

  // 1. SWR Data Fetching (Replaces useEffect, loading state, and profile/address state!)
  const { data: profileData, isLoading: loadingProfile, error: profileError } = useSWR('/auth/me', () => api.getMe());
  const { data: addressesData, isLoading: loadingAddresses } = useSWR('/addresses', () => api.getAddresses());

  const profile = (profileData as MeResponse)?.user;
  const addresses = (addressesData as Address[]) || [];
  const loading = loadingProfile || loadingAddresses;

  // Handle redirect if unauthenticated
  if (profileError) {
    toast.error("Please login to access your account dashboard.");
    router.push("/login");
  }

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
      await api.logout();
      toast.success("Logged out successfully. See you soon!");
      router.push("/login");
    } catch {
      toast.error("Failed to logout. Please try again.");
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
    } catch {
      toast.error("Failed to remove address. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50/50">
        <Loader2 className="h-10 w-10 text-black animate-spin mb-4" />
        <p className="text-gray-500 font-medium animate-pulse">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-16 sm:px-6 lg:px-8 min-h-screen">
      {/* Dashboard Top Intro */}
      <div className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">
            My Account
          </h1>
          <p className="text-gray-500 text-sm">
            Manage your personal profile settings, shipping details, and shopping records.
          </p>
        </div>

        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="inline-flex items-center px-4 py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 hover:border-rose-300 text-xs font-bold text-rose-700 hover:text-rose-800 rounded-xl transition duration-200"
        >
          {loggingOut ? (
            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
          ) : (
            <LogOut className="h-3.5 w-3.5 mr-1.5" />
          )}
          Sign Out
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ================= COLUMN 1: PROFILE SUMMARY ================= */}
        <div className="lg:col-span-1 space-y-6">

          {/* User Profile Card */}
          <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 h-24 w-24 bg-gray-50 rounded-bl-full flex items-start justify-end p-4 text-gray-200 z-0">
              <Sparkles className="h-6 w-6" />
            </div>

            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="h-16 w-16 bg-black text-white rounded-2xl flex items-center justify-center text-xl font-bold mb-4 shadow-md">
                {(profile?.name || "User").slice(0, 2).toUpperCase()}
              </div>

              <h3 className="text-lg font-bold text-gray-900 mb-1">{profile?.name}</h3>

              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-gray-100 text-gray-700 border border-gray-200 mb-6">
                <Shield className="h-3 w-3 mr-1" />
                {profile?.role} Member
              </span>

              <div className="w-full space-y-3.5 text-left border-t border-gray-100 pt-5">
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="h-4 w-4 mr-3 text-gray-400 shrink-0" />
                  <span className="truncate">{profile?.email}</span>
                </div>

                <div className="flex items-center text-sm text-gray-600">
                  <Shield className="h-4 w-4 mr-3 text-gray-400 shrink-0" />
                  <span>Joined {new Date(profile?.createdAt || "").toLocaleDateString("en-US", { year: "numeric", month: "short" })}</span>
                </div>
              </div>
            </div>
          </div>

          <Link
            href="/account/orders"
            className="group bg-black hover:bg-neutral-900 text-white rounded-3xl p-6 shadow-sm flex justify-between items-center transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-white/10 rounded-xl flex items-center justify-center text-white">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm">Shopping History</h4>
                <p className="text-xs text-neutral-400">View and track all past orders</p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-neutral-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
          </Link>

        </div>

        {/* ================= COLUMN 2 & 3: ADDRESS BOOK ================= */}
        <div className="lg:col-span-2 space-y-6">

          <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-2.5">
                <MapPin className="h-5 w-5 text-gray-400" />
                <h3 className="font-bold text-lg text-gray-900">Address Book</h3>
              </div>

              {!showAddressForm && (
                <button
                  onClick={() => setShowAddressForm(true)}
                  className="inline-flex items-center px-3.5 py-2 bg-black hover:bg-neutral-800 text-white text-xs font-semibold rounded-xl shadow-sm transition duration-200"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  New Address
                </button>
              )}
            </div>

            {/* Inline New Address Form */}
            {showAddressForm && (
              <form onSubmit={handleSubmit(onSubmitAddress)} className="bg-gray-50 border border-gray-150 rounded-2xl p-5 mb-6 space-y-4">
                <div className="flex justify-between items-center border-b border-gray-150 pb-3 mb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    Add New Shipping Location
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowAddressForm(false)}
                    className="text-xs font-semibold text-gray-400 hover:text-black transition"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Recipient Full Name</label>
                    <input
                      {...register("fullName")}
                      type="text"
                      placeholder="e.g. Kingsley Ibeh"
                      className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm focus:outline-none focus:border-black transition"
                    />
                    {errors.fullName && <span className="text-red-500 text-xs mt-1 block">{errors.fullName.message}</span>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Contact Phone Number</label>
                    <input
                      {...register("phone")}
                      type="tel"
                      placeholder="e.g. +234 812 345 6789"
                      className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm focus:outline-none focus:border-black transition"
                    />
                    {errors.phone && <span className="text-red-500 text-xs mt-1 block">{errors.phone.message}</span>}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Street Address</label>
                    <input
                      {...register("street")}
                      type="text"
                      placeholder="e.g. 15 Akinwunmi Street, Ejigbo"
                      className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm focus:outline-none focus:border-black transition"
                    />
                    {errors.street && <span className="text-red-500 text-xs mt-1 block">{errors.street.message}</span>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">City / Town</label>
                    <input
                      {...register("city")}
                      type="text"
                      placeholder="e.g. Ikeja"
                      className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm focus:outline-none focus:border-black transition"
                    />
                    {errors.city && <span className="text-red-500 text-xs mt-1 block">{errors.city.message}</span>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">State / Province</label>
                    <input
                      {...register("state")}
                      type="text"
                      placeholder="e.g. Lagos"
                      className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm focus:outline-none focus:border-black transition"
                    />
                    {errors.state && <span className="text-red-500 text-xs mt-1 block">{errors.state.message}</span>}
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <LoadingButton
                    type="submit"
                    loading={isSubmitting}
                    className="inline-flex items-center px-4 py-2.5 bg-black hover:bg-neutral-800 text-white text-xs font-bold rounded-xl shadow-sm transition"
                  >
                    Save Location Address
                  </LoadingButton>
                </div>
              </form>
            )}

            {/* Address List */}
            {addresses.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-150 rounded-2xl">
                <MapPin className="mx-auto h-8 w-8 text-gray-300 mb-3" />
                <p className="text-sm font-semibold text-gray-900 mb-1">No shipping address recorded</p>
                <p className="text-xs text-gray-400 max-w-60 mx-auto">
                  Add shipping destinations to enable rapid one-click checkout on future purchases!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {addresses.map((address) => (
                  <div
                    key={address.id}
                    className="border border-gray-150 rounded-2xl p-4 relative group hover:border-gray-300 hover:bg-gray-50/30 transition duration-200"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center space-x-1.5">
                        <Home className="h-3.5 w-3.5 text-gray-400" />
                        <h4 className="text-xs font-bold text-gray-800 truncate max-w-30">
                          {address.fullName}
                        </h4>
                      </div>

                      <button
                        onClick={() => setAddressToDelete(address.id)}
                        className="text-gray-400 hover:text-rose-600 transition p-0.5"
                        title="Delete Address"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="space-y-1 text-xs text-gray-500 leading-normal">
                      <p className="line-clamp-2">{address.street}</p>
                      <p>{address.city}, {address.state}</p>
                      <p className="font-semibold text-gray-600">{address.country}</p>

                      <div className="flex items-center text-[10px] text-gray-400 mt-2.5 pt-2 border-t border-gray-100">
                        <Phone className="h-3 w-3 mr-1 text-gray-300" />
                        {address.phone}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>

        </div>

      </div>
      <ConfirmModal
        open={Boolean(addressToDelete)}
        title="Delete address?"
        message="This shipping address will be removed from your account."
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
