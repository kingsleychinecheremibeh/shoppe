"use client";

import { ChangeEvent, SyntheticEvent, useEffect, useMemo, useState } from "react";
import { Edit, ImageIcon, Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { AlertBanner, ConfirmModal, EmptyState, FieldError, LoadingButton } from "@/app/components/feedback";
import { api, getAssetUrl } from "@/lib/api";

type UserData = {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
};

type MeResponse = {
  user: UserData;
};

type Category = {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
  createdAt?: string;
  activeProductCount?: number;
};

type CategoryFormData = {
  name: string;
  image: string;
};

const initialFormData: CategoryFormData = {
  name: "",
  image: "",
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error) return error.message;
  return fallback;
};

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [formData, setFormData] = useState(initialFormData);
  const [fetchError, setFetchError] = useState("");
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof CategoryFormData, string>>>({});

  const fetchCategories = async () => {
    try {
      setFetchError("");
      const me = (await api.getMe()) as MeResponse;

      if (me.user.role !== "ADMIN") {
        toast.error("You need an admin account to manage categories.");
        window.location.assign("/");
        return;
      }

      const data = await api.getCategories();
      setCategories((data as Category[]) || []);
    } catch (error) {
      const message = getErrorMessage(error, "Failed to fetch categories.");
      setFetchError(message);
      toast.error(message);
      window.location.assign("/login");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(fetchCategories);
  }, []);

  const filteredCategories = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return categories;

    return categories.filter((category) => {
      return (
        category.name.toLowerCase().includes(search) ||
        category.slug.toLowerCase().includes(search)
      );
    });
  }, [categories, query]);

  const handleOpenModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        image: category.image || "",
      });
    } else {
      setEditingCategory(null);
      setFormData(initialFormData);
    }

    setShowModal(true);
  };

  const handleCloseModal = () => {
    if (saving) return;
    setShowModal(false);
    setEditingCategory(null);
    setFormData(initialFormData);
    setFormErrors({});
  };

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: Partial<Record<keyof CategoryFormData, string>> = {};

    if (formData.name.trim().length < 2) {
      nextErrors.name = "Category name must be at least 2 characters.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setFormErrors(nextErrors);
      return;
    }

    setFormErrors({});
    setSaving(true);

    const payload = {
      name: formData.name.trim(),
      image: formData.image.trim() || null,
    };

    try {
      if (editingCategory) {
        await api.updateCategory(editingCategory.id, payload);
        toast.success("Category updated successfully.");
      } else {
        await api.createCategory(payload);
        toast.success("Category created successfully.");
      }

      setShowModal(false);
      setEditingCategory(null);
      setFormData(initialFormData);
      setFormErrors({});
      await fetchCategories();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to save category."));
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
    setFormErrors((current) => ({
      ...current,
      [name]: undefined,
    }));
  };

  const handleDelete = async (category: Category) => {
    try {
      await api.deleteCategory(category.id);
      toast.success("Category deleted successfully.");
      await fetchCategories();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to delete category."));
    }
  };

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-gray-50/50 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between border-b border-gray-100 pb-8">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Inventory Taxonomy</span>
            <h1 className="mt-1.5 text-4xl font-serif font-black tracking-tight text-gray-950">Store Categories</h1>
            <p className="mt-2 text-xs font-medium text-gray-500 max-w-lg leading-relaxed">
              Organize your catalog into distinct shopping ranges, map fallback imagery, and monitor product volume counts.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="relative block sm:w-72">
              <span className="sr-only">Search categories</span>
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                id="adminCategorySearch"
                name="adminCategorySearch"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search categories..."
                className="h-10 w-full rounded-full border border-gray-200 bg-white pl-10 pr-4 text-xs font-medium text-gray-950 outline-none transition duration-300 focus:border-gray-950 focus:ring-2 focus:ring-gray-950/5"
              />
            </label>

            <button
              type="button"
              onClick={() => handleOpenModal()}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-gray-950 px-5 text-xs font-semibold text-white transition hover:bg-gray-800 uppercase tracking-wider shadow-xs"
            >
              <Plus className="h-4 w-4" />
              Add Category
            </button>
          </div>
        </div>

        {fetchError && (
          <div className="mb-6">
            <AlertBanner variant="error" message={fetchError} />
          </div>
        )}

        {/* Table List Layout */}
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-gray-950" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-180">
                <thead className="bg-gray-50">
                  <tr>
                    <TableHead>Category</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Products</TableHead>
                    <TableHead>Image</TableHead>
                    <TableHead align="right">Actions</TableHead>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredCategories.length ? (
                    filteredCategories.map((category) => (
                      <tr key={category.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <CategoryThumbnail category={category} />
                            <div>
                              <p className="text-xs font-bold text-gray-900">{category.name}</p>
                              <p className="text-[10px] text-gray-400 font-mono mt-0.5">ID {category.id.slice(0, 8).toUpperCase()}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <code className="rounded bg-gray-50 border border-gray-200 px-2 py-0.5 text-[10px] font-mono font-bold text-gray-700">
                            {category.slug}
                          </code>
                        </td>
                        <td className="px-6 py-4 text-xs font-semibold text-gray-600">
                          {category.activeProductCount ?? 0} active items
                        </td>
                        <td className="px-6 py-4 text-xs">
                          {category.image ? (
                            <span className="text-emerald-700 font-bold uppercase text-[9px] bg-emerald-50 border border-emerald-200/50 px-2 py-0.5 rounded-full">Bound</span>
                          ) : (
                            <span className="text-gray-400 font-bold uppercase text-[9px] bg-gray-50 border border-gray-200/50 px-2 py-0.5 rounded-full">Empty</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenModal(category)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 border border-gray-100"
                              aria-label={`Edit ${category.name}`}
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setCategoryToDelete(category)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-red-600 transition hover:bg-red-50"
                              aria-label={`Delete ${category.name}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12">
                        <EmptyState
                          title={query ? "No categories match your search" : "No categories yet"}
                          message={
                            query
                              ? "Try a different search term."
                              : "Create your first category before adding catalog products."
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

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl border border-gray-200 py-1">
            <div className="flex items-center justify-between border-b border-gray-100 p-6">
              <div>
                <h2 className="text-xl font-serif font-black tracking-tight text-gray-950">
                  {editingCategory ? "Modify Category Details" : "Create New Category"}
                </h2>
                <p className="mt-1.5 text-[10px] text-gray-400 font-medium">
                  Categories must match storefront slugs exactly for route mapping redirects.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="inline-flex h-8.5 w-8.5 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-950"
                aria-label="Close modal"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-6">
              <div>
                <label htmlFor="name" className="mb-2 block text-xs font-bold text-gray-700 uppercase tracking-wide">
                  Category Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  minLength={2}
                  maxLength={80}
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-xs font-medium text-gray-950 outline-none transition focus:border-gray-950 focus:ring-2 focus:ring-gray-900/5"
                  placeholder="e.g. Modern Accessories"
                />
                <FieldError message={formErrors.name} />
              </div>

              <div>
                <label htmlFor="image" className="mb-2 block text-xs font-bold text-gray-700 uppercase tracking-wide">
                  Cover Image URL
                </label>
                <input
                  id="image"
                  name="image"
                  type="url"
                  value={formData.image}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-xs font-medium text-gray-950 outline-none transition focus:border-gray-950 focus:ring-2 focus:ring-gray-900/5"
                  placeholder="https://images.unsplash.com/photo-..."
                />
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
                  {editingCategory ? "Update Category" : "Create Category"}
                </LoadingButton>
              </div>
            </form>
          </div>
        </div>
      )}
      <ConfirmModal
        open={Boolean(categoryToDelete)}
        title="Delete category?"
        message={
          categoryToDelete
            ? `Delete "${categoryToDelete.name}"? This cannot be undone.`
            : "This category will be removed."
        }
        confirmLabel="Delete"
        onClose={() => setCategoryToDelete(null)}
        onConfirm={() => {
          if (!categoryToDelete) return;
          const category = categoryToDelete;
          setCategoryToDelete(null);
          void handleDelete(category);
        }}
      />
    </main>
  );
}

function TableHead({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      className={`px-6 py-3 text-xs font-semibold uppercase text-gray-500 ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

function CategoryThumbnail({ category }: { category: Category }) {
  const imageUrl = getAssetUrl(category.image);

  if (!imageUrl) {
    return (
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gray-50 border border-gray-200 text-gray-400">
        <ImageIcon className="h-4.5 w-4.5" />
      </div>
    );
  }

  return (
    <div
      className="h-11 w-11 shrink-0 rounded-lg bg-gray-50 bg-cover bg-center border border-gray-200"
      style={{ backgroundImage: `url("${imageUrl}")` }}
      aria-label={category.name}
    />
  );
}
