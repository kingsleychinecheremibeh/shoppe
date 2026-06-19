"use client";

import { useEffect, useMemo, useState } from "react";
import { ShieldCheck, Users } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

type Role = "USER" | "MANAGER" | "ADMIN";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  managerPermissions?: string[];
};

type MeResponse = {
  user: AdminUser;
};

const permissions = [
  { id: "ORDER_MANAGEMENT", label: "Orders" },
  { id: "PRODUCT_MANAGEMENT", label: "Products" },
  { id: "SHIPPING_MANAGEMENT", label: "Shipping" },
  { id: "ANALYTICS", label: "Analytics" },
];

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error) return error.message;
  return fallback;
};

export default function AdminManagersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const managers = useMemo(() => {
    return users.filter((user) => user.role === "ADMIN" || user.role === "MANAGER");
  }, [users]);

  const customers = useMemo(() => {
    return users.filter((user) => user.role === "USER");
  }, [users]);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const me = (await api.getMe()) as MeResponse;
        if (me.user.role !== "ADMIN") {
          toast.error("Only admins can manage staff access.");
          window.location.assign("/");
          return;
        }

        const data = await api.getAdminUsers();
        setUsers((data as AdminUser[]) || []);
      } catch (error) {
        toast.error(getErrorMessage(error, "Unable to load users."));
        window.location.assign("/login");
      } finally {
        setLoading(false);
      }
    };

    void loadUsers();
  }, []);

  const updateRole = async (user: AdminUser, role: Role, managerPermissions = user.managerPermissions || []) => {
    const nextPermissions =
      role === "MANAGER" && managerPermissions.length === 0
        ? ["ORDER_MANAGEMENT"]
        : managerPermissions;

    setSavingId(user.id);
    try {
      const updatedUser = (await api.updateUserRole(user.id, {
        role,
        managerPermissions: role === "MANAGER" ? nextPermissions : [],
      })) as AdminUser;

      setUsers((current) => current.map((item) => (item.id === user.id ? updatedUser : item)));
      toast.success("Staff access updated.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to update staff access."));
    } finally {
      setSavingId(null);
    }
  };

  const togglePermission = (user: AdminUser, permission: string) => {
    const current = new Set(user.managerPermissions || []);
    if (current.has(permission)) {
      current.delete(permission);
    } else {
      current.add(permission);
    }
    void updateRole(user, "MANAGER", Array.from(current));
  };

  if (loading) {
    return (
      <main className="min-h-[calc(100vh-5rem)] bg-gray-50/50 py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-gray-950" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-gray-50/50 py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 border-b border-gray-100 pb-6">
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-600">Staff Access</span>
          <h1 className="mt-1.5 text-4xl font-serif font-black tracking-tight text-gray-950">Managers</h1>
          <p className="mt-2 max-w-xl text-xs font-medium leading-relaxed text-gray-500">
            Promote users to managers and choose exactly which areas they can operate.
          </p>
        </div>

        <section className="mb-8 rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
            <ShieldCheck className="h-4 w-4 text-gray-600" />
            <h2 className="text-sm font-black text-gray-950">Current Staff</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {managers.length ? (
              managers.map((user) => (
                <UserAccessRow
                  key={user.id}
                  user={user}
                  saving={savingId === user.id}
                  onRoleChange={updateRole}
                  onPermissionToggle={togglePermission}
                />
              ))
            ) : (
              <p className="px-5 py-8 text-center text-xs font-semibold text-gray-500">No managers yet.</p>
            )}
          </div>
        </section>

        <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
            <Users className="h-4 w-4 text-gray-600" />
            <h2 className="text-sm font-black text-gray-950">Customers</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {customers.map((user) => (
              <UserAccessRow
                key={user.id}
                user={user}
                saving={savingId === user.id}
                onRoleChange={updateRole}
                onPermissionToggle={togglePermission}
              />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function UserAccessRow({
  user,
  saving,
  onRoleChange,
  onPermissionToggle,
}: {
  user: AdminUser;
  saving: boolean;
  onRoleChange: (user: AdminUser, role: Role, managerPermissions?: string[]) => void;
  onPermissionToggle: (user: AdminUser, permission: string) => void;
}) {
  const isManager = user.role === "MANAGER";

  return (
    <div className="grid gap-4 px-5 py-4 lg:grid-cols-[1fr_auto] lg:items-center">
      <div>
        <p className="text-sm font-bold text-gray-950">{user.name}</p>
        <p className="mt-0.5 text-xs font-medium text-gray-500">{user.email}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={user.role}
          disabled={saving}
          onChange={(event) => onRoleChange(user, event.target.value as Role)}
          className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-xs font-bold text-gray-800 outline-none transition focus:border-gray-950 disabled:opacity-60"
        >
          <option value="USER">User</option>
          <option value="MANAGER">Manager</option>
          <option value="ADMIN">Admin</option>
        </select>

        {permissions.map((permission) => {
          const checked = user.managerPermissions?.includes(permission.id) || false;
          return (
            <label
              key={permission.id}
              className={`inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-bold transition ${
                isManager
                  ? "cursor-pointer border-gray-200 text-gray-700 hover:border-gray-950"
                  : "cursor-not-allowed border-gray-100 text-gray-300"
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                disabled={!isManager || saving}
                onChange={() => onPermissionToggle(user, permission.id)}
                className="h-3.5 w-3.5 accent-gray-950"
              />
              {permission.label}
            </label>
          );
        })}
      </div>
    </div>
  );
}
