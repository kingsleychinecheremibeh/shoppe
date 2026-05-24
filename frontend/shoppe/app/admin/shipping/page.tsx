"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import { api } from "@/lib/api";
import { LoadingButton } from "@/app/components/feedback";

type ShippingMethod = {
  id: string;
  name: string;
  description?: string;
  price: string | number;
  estimatedDays?: string;
  isActive: boolean;
  sortOrder: number;
};

export default function AdminShippingPage() {
  const { data, isLoading } = useSWR("/shipping-methods/admin", () =>
    api.getAdminShippingMethods()
  );

  const methods = (data as ShippingMethod[] | undefined) ?? [];

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    estimatedDays: "",
    isActive: true,
    sortOrder: 0,
  });

  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await api.createShippingMethod({
        ...form,
        price: Number(form.price),
        sortOrder: Number(form.sortOrder),
      });

      setForm({
        name: "",
        description: "",
        price: "",
        estimatedDays: "",
        isActive: true,
        sortOrder: 0,
      });

      mutate("/shipping-methods/admin");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (method: ShippingMethod) => {
    await api.updateShippingMethod(method.id, {
      isActive: !method.isActive,
    });
    mutate("/shipping-methods/admin");
  };

  if (isLoading) return <main className="p-8">Loading...</main>;

  return (
    <main className="p-8 space-y-8">
      <h1 className="text-2xl font-bold">Shipping Methods</h1>

      <section className="rounded-lg border bg-white p-6 space-y-4">
        <h2 className="font-semibold">Add Shipping Method</h2>

        <input className="border p-2 w-full" placeholder="Name" value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })} />

        <input className="border p-2 w-full" placeholder="Description" value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })} />

        <input className="border p-2 w-full" placeholder="Price" value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })} />

        <input className="border p-2 w-full" placeholder="Estimated days" value={form.estimatedDays}
          onChange={(e) => setForm({ ...form, estimatedDays: e.target.value })} />

        <input className="border p-2 w-full" type="number" placeholder="Sort order" value={form.sortOrder}
          onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} />

        <LoadingButton loading={saving} onClick={save} className="rounded bg-black px-4 py-2 text-white">
          Save
        </LoadingButton>
      </section>

      <section className="space-y-3">
        {methods.map((method) => (
          <div key={method.id} className="rounded-lg border bg-white p-4 flex justify-between">
            <div>
              <p className="font-semibold">{method.name}</p>
              <p className="text-sm text-gray-600">₦{Number(method.price).toLocaleString()} · {method.estimatedDays}</p>
              <p className="text-xs">{method.isActive ? "Active" : "Inactive"}</p>
            </div>

            <button onClick={() => toggleActive(method)} className="rounded border px-3 py-2 text-sm">
              {method.isActive ? "Disable" : "Enable"}
            </button>
          </div>
        ))}
      </section>
    </main>
  );
}