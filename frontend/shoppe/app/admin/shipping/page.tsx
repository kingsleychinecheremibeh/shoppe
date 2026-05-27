"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import { api } from "@/lib/api";
import { useHydrated } from "@/app/hooks/use-hydrated";
import { toast } from "sonner";
import { Plus, Truck, X } from "lucide-react";
import {
  AlertBanner,
  ConfirmModal,
  EmptyState,
  FieldError,
  LoadingButton,
} from "@/app/components/feedback";

type ShippingMethod = {
  id: string;
  name: string;
  description?: string;
  price: string | number;
  estimatedDays?: string;
  isActive: boolean;
  sortOrder: number;
};

const emptyForm = {
  name: "",
  description: "",
  price: "",
  estimatedDays: "",
  isActive: true,
  sortOrder: 0,
};

export default function AdminShippingPage() {
  const {
    data,
    isLoading,
    error: fetchError,
  } = useSWR("/shipping-methods/admin", () => api.getAdminShippingMethods());

  const methods = (data as ShippingMethod[] | undefined) ?? [];

  const [showModal, setShowModal] = useState(false);
  const [editingMethod, setEditingMethod] = useState<ShippingMethod | null>(null);
  const [methodToDelete, setMethodToDelete] = useState<ShippingMethod | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const mounted = useHydrated();

  const handleOpenModal = (method?: ShippingMethod) => {
    if (method) {
      setEditingMethod(method);
      setForm({
        name: method.name,
        description: method.description ?? "",
        price: String(method.price),
        estimatedDays: method.estimatedDays ?? "",
        isActive: method.isActive,
        sortOrder: method.sortOrder,
      });
    } else {
      setEditingMethod(null);
      setForm(emptyForm);
    }
    setFormErrors({});
    setShowModal(true);
  };

  const handleCloseModal = () => {
    if (saving) return;
    setShowModal(false);
    setEditingMethod(null);
    setForm(emptyForm);
    setFormErrors({});
  };

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!form.name.trim() || form.name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters.";
    }
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) < 0) {
      errors.price = "Enter a valid price (≥ 0).";
    }
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    setSaving(true);

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      price: Number(form.price),
      estimatedDays: form.estimatedDays.trim() || undefined,
      isActive: form.isActive,
      sortOrder: Number(form.sortOrder),
    };

    try {
      if (editingMethod) {
        await api.updateShippingMethod(editingMethod.id, payload);
        toast.success("Shipping method updated.");
      } else {
        await api.createShippingMethod(payload);
        toast.success("Shipping method created.");
      }
      handleCloseModal();
      mutate("/shipping-methods/admin");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save shipping method."
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (method: ShippingMethod) => {
    setTogglingId(method.id);
    try {
      await api.updateShippingMethod(method.id, {
        isActive: !method.isActive,
      });
      mutate("/shipping-methods/admin");
      toast.success(
        `"${method.name}" ${method.isActive ? "disabled" : "enabled"}.`
      );
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update shipping method."
      );
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (method: ShippingMethod) => {
    try {
      await api.deleteShippingMethod(method.id);
      toast.success(`"${method.name}" deleted.`);
      mutate("/shipping-methods/admin");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete shipping method."
      );
    }
  };

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-gray-50/50 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between border-b border-gray-100 pb-8">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-600">
              Fulfillment Settings
            </span>
            <h1 className="mt-1.5 text-4xl font-serif font-black tracking-tight text-gray-950">
              Shipping Methods
            </h1>
            <p className="mt-2 text-xs font-medium text-gray-500 max-w-lg leading-relaxed">
              Configure delivery options available at checkout. Control pricing,
              estimated delivery windows, and visibility.
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleOpenModal()}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-gray-950 px-5 text-xs font-semibold text-white transition hover:bg-gray-800 uppercase tracking-wider shadow-xs"
          >
            <Plus className="h-4 w-4" />
            Add Method
          </button>
        </div>

        {fetchError && (
          <div className="mb-6">
            <AlertBanner
              variant="error"
              message={
                fetchError instanceof Error
                  ? fetchError.message
                  : "Failed to load shipping methods."
              }
            />
          </div>
        )}

        {/* Table */}
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs">
          {!mounted || isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-gray-950" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                      Method
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                      Delivery
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                      Order
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {methods.length ? (
                    methods.map((method) => (
                      <tr key={method.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gray-50 border border-gray-200 text-gray-600">
                              <Truck className="h-4.5 w-4.5" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-gray-900">
                                {method.name}
                              </p>
                              {method.description && (
                                <p className="text-[10px] text-gray-600 mt-0.5 max-w-xs truncate">
                                  {method.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs font-semibold text-gray-700">
                          ₦{Number(method.price).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-600">
                          {method.estimatedDays || "—"}
                        </td>
                        <td className="px-6 py-4">
                          {method.isActive ? (
                            <span className="text-emerald-700 font-bold uppercase text-[9px] bg-emerald-50 border border-emerald-200/50 px-2 py-0.5 rounded-full">
                              Active
                            </span>
                          ) : (
                            <span className="text-gray-600 font-bold uppercase text-[9px] bg-gray-50 border border-gray-200/50 px-2 py-0.5 rounded-full">
                              Inactive
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <code className="rounded bg-gray-50 border border-gray-200 px-2 py-0.5 text-[10px] font-mono font-bold text-gray-700">
                            {method.sortOrder}
                          </code>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenModal(method)}
                              className="inline-flex h-8 items-center justify-center rounded-lg px-3 text-xs font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 border border-gray-100"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleActive(method)}
                              disabled={togglingId === method.id}
                              className={`inline-flex h-8 items-center justify-center rounded-lg px-3 text-xs font-medium transition border ${
                                method.isActive
                                  ? "text-amber-700 border-amber-200 hover:bg-amber-50"
                                  : "text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                              } disabled:opacity-50`}
                            >
                              {togglingId === method.id
                                ? "..."
                                : method.isActive
                                ? "Disable"
                                : "Enable"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setMethodToDelete(method)}
                              className="inline-flex h-8 items-center justify-center rounded-lg px-3 text-xs font-medium text-red-600 transition hover:bg-red-50 border border-red-100"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12">
                        <EmptyState
                          title="No shipping methods"
                          message="Add your first shipping method to enable checkout delivery options."
                          action={
                            <button
                              type="button"
                              onClick={() => handleOpenModal()}
                              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-gray-950 px-5 text-xs font-semibold text-white transition hover:bg-gray-800 uppercase tracking-wider"
                            >
                              <Plus className="h-4 w-4" />
                              Add Method
                            </button>
                          }
                        />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl border border-gray-200 py-1">
            <div className="flex items-center justify-between border-b border-gray-100 p-6">
              <div>
                <h2 className="text-xl font-serif font-black tracking-tight text-gray-950">
                  {editingMethod
                    ? "Edit Shipping Method"
                    : "New Shipping Method"}
                </h2>
                <p className="mt-1.5 text-[10px] text-gray-600 font-medium">
                  {editingMethod
                    ? "Update method details. Changes apply to future orders only."
                    : "Define a new delivery option for your storefront checkout."}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-600 transition hover:bg-gray-100 hover:text-gray-950"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-6">
              <div>
                <label
                  htmlFor="shippingName"
                  className="mb-2 block text-xs font-bold text-gray-700 uppercase tracking-wide"
                >
                  Method Name
                </label>
                <input
                  id="shippingName"
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => {
                    setForm({ ...form, name: e.target.value });
                    setFormErrors({ ...formErrors, name: "" });
                  }}
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-xs font-medium text-gray-950 outline-none transition focus:border-gray-950 focus:ring-2 focus:ring-gray-900/5"
                  placeholder="e.g. Standard Delivery"
                />
                <FieldError message={formErrors.name} />
              </div>

              <div>
                <label
                  htmlFor="shippingDesc"
                  className="mb-2 block text-xs font-bold text-gray-700 uppercase tracking-wide"
                >
                  Description
                  <span className="ml-1 text-[9px] text-gray-600 normal-case tracking-normal font-normal">
                    (optional)
                  </span>
                </label>
                <input
                  id="shippingDesc"
                  type="text"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-xs font-medium text-gray-950 outline-none transition focus:border-gray-950 focus:ring-2 focus:ring-gray-900/5"
                  placeholder="e.g. Delivered within 3-5 business days"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="shippingPrice"
                    className="mb-2 block text-xs font-bold text-gray-700 uppercase tracking-wide"
                  >
                    Price (₦)
                  </label>
                  <input
                    id="shippingPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={form.price}
                    onChange={(e) => {
                      setForm({ ...form, price: e.target.value });
                      setFormErrors({ ...formErrors, price: "" });
                    }}
                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-xs font-medium text-gray-950 outline-none transition focus:border-gray-950 focus:ring-2 focus:ring-gray-900/5"
                    placeholder="0.00"
                  />
                  <FieldError message={formErrors.price} />
                </div>

                <div>
                  <label
                    htmlFor="shippingDays"
                    className="mb-2 block text-xs font-bold text-gray-700 uppercase tracking-wide"
                  >
                    Est. Delivery
                    <span className="ml-1 text-[9px] text-gray-600 normal-case tracking-normal font-normal">
                      (optional)
                    </span>
                  </label>
                  <input
                    id="shippingDays"
                    type="text"
                    value={form.estimatedDays}
                    onChange={(e) =>
                      setForm({ ...form, estimatedDays: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-xs font-medium text-gray-950 outline-none transition focus:border-gray-950 focus:ring-2 focus:ring-gray-900/5"
                    placeholder="e.g. 3-5 days"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="shippingSortOrder"
                    className="mb-2 block text-xs font-bold text-gray-700 uppercase tracking-wide"
                  >
                    Sort Order
                  </label>
                  <input
                    id="shippingSortOrder"
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) =>
                      setForm({ ...form, sortOrder: Number(e.target.value) })
                    }
                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-xs font-medium text-gray-950 outline-none transition focus:border-gray-950 focus:ring-2 focus:ring-gray-900/5"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold text-gray-700 uppercase tracking-wide">
                    Status
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setForm({ ...form, isActive: !form.isActive })
                    }
                    className={`w-full rounded-lg border px-4 py-3 text-xs font-semibold transition ${
                      form.isActive
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-gray-200 bg-gray-50 text-gray-500"
                    }`}
                  >
                    {form.isActive ? "✓ Active" : "Inactive"}
                  </button>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 pt-2.5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={saving}
                  className="h-11 rounded-lg border border-gray-200 bg-white px-6 text-xs font-bold uppercase tracking-wide text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>
                <LoadingButton
                  type="submit"
                  loading={saving}
                  className="h-11 rounded-lg bg-gray-950 px-6 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {editingMethod ? "Update Method" : "Create Method"}
                </LoadingButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        open={Boolean(methodToDelete)}
        title="Delete shipping method?"
        message={
          methodToDelete
            ? `Delete "${methodToDelete.name}"? Existing orders using this method won't be affected.`
            : "This shipping method will be removed."
        }
        confirmLabel="Delete"
        onClose={() => setMethodToDelete(null)}
        onConfirm={() => {
          if (!methodToDelete) return;
          const m = methodToDelete;
          setMethodToDelete(null);
          void handleDelete(m);
        }}
      />
    </main>
  );
}
