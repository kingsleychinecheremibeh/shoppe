"use client";

import { ChangeEvent, SyntheticEvent, useEffect, useMemo, useState } from "react";
import { Edit, ImageIcon, Plus, Search, Trash2, X, AlertCircle, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

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
};

type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number | string;
  stock: number;
  image?: string | null;
  categoryId: string;
  category?: Category | null;
};

type ProductFormData = {
  name: string;
  description: string;
  price: string;
  stock: string;
  categoryId: string;
  image: string;
};

const initialFormData: ProductFormData = {
  name: "",
  description: "",
  price: "",
  stock: "0",
  categoryId: "",
  image: "",
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const getNumber = (value: number | string | null | undefined) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error) return error.message;
  return fallback;
};

const getStockClassName = (stock: number) => {
  if (stock === 0) return "bg-red-100 text-red-800";
  if (stock < 10) return "bg-orange-100 text-orange-800";
  return "bg-green-100 text-green-800";
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState(initialFormData);

  const fetchProducts = async () => {
    try {
      const me = (await api.getMe()) as MeResponse;

      if (me.user.role !== "ADMIN") {
        toast.error("You need an admin account to manage products.");
        window.location.assign("/");
        return;
      }

      const [productsData, categoriesData] = await Promise.all([
        api.getProducts(),
        api.getCategories(),
      ]);

      setProducts((productsData as Product[]) || []);
      setCategories((categoriesData as Category[]) || []);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to fetch products."));
      window.location.assign("/login");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(fetchProducts);
  }, []);

  const filteredProducts = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return products;

    return products.filter((product) => {
      return (
        product.name.toLowerCase().includes(search) ||
        product.slug.toLowerCase().includes(search) ||
        product.category?.name.toLowerCase().includes(search)
      );
    });
  }, [products, query]);

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description || "",
        price: String(product.price),
        stock: String(product.stock ?? 0),
        categoryId: product.categoryId || product.category?.id || "",
        image: product.image || "",
      });
    } else {
      setEditingProduct(null);
      setFormData({
        ...initialFormData,
        categoryId: categories[0]?.id || "",
      });
    }

    setShowModal(true);
  };

  const handleCloseModal = () => {
    if (saving) return;
    setShowModal(false);
    setEditingProduct(null);
    setFormData(initialFormData);
  };

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!formData.categoryId) {
      toast.error("Select a category for this product.");
      return;
    }

    const price = Number(formData.price);
    const stock = Number(formData.stock);

    if (!Number.isFinite(price) || price <= 0) {
      toast.error("Price must be a positive number.");
      return;
    }

    if (!Number.isInteger(stock) || stock < 0) {
      toast.error("Stock must be a non-negative whole number.");
      return;
    }

    setSaving(true);

    const payload: {
      name: string;
      description: string;
      price: number;
      stock: number;
      categoryId: string;
      image?: string;
    } = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      price,
      stock,
      categoryId: formData.categoryId,
    };

    if (formData.image.trim()) {
      payload.image = formData.image.trim();
    }

    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct.id, payload);
        toast.success("Product updated successfully.");
      } else {
        await api.createProduct(payload);
        toast.success("Product created successfully.");
      }

      setShowModal(false);
      setEditingProduct(null);
      setFormData(initialFormData);
      await fetchProducts();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to save product."));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product: Product) => {
    const confirmed = window.confirm(
      `Delete "${product.name}"? This will remove it from the storefront.`
    );

    if (!confirmed) return;

    try {
      await api.deleteProduct(product.id);
      toast.success("Product deleted successfully.");
      await fetchProducts();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to delete product."));
    }
  };

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-gray-50/50 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Header Section */}
        <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between border-b border-gray-100 pb-8">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Inventory Catalog</span>
            <h1 className="mt-1.5 text-4xl font-serif font-black tracking-tight text-gray-950">Store Products</h1>
            <p className="mt-2 text-xs font-medium text-gray-500 max-w-lg leading-relaxed">
              Manage product listings, pricing edits, instant stock allocations, and shop taxonomy updates.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="relative block sm:w-80">
              <span className="sr-only">Search products</span>
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search products by title, category..."
                className="h-10 w-full rounded-full border border-gray-200 bg-white pl-10 pr-4 text-xs font-medium text-gray-950 outline-none transition duration-300 focus:border-gray-950 focus:ring-2 focus:ring-gray-950/5"
              />
            </label>

            <button
              type="button"
              onClick={() => handleOpenModal()}
              disabled={!categories.length}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-gray-950 px-5 text-xs font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 uppercase tracking-wider shadow-xs"
            >
              <Plus className="h-4 w-4" />
              Add Product
            </button>
          </div>
        </div>

        {/* Categories Check Alert */}
        {!categories.length && !loading && (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 flex gap-3 text-amber-800">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p className="text-xs font-medium mt-0.5">Please create at least one category before attempt to register new catalog products.</p>
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
              <table className="w-full min-w-[880px]">
                <thead className="bg-gray-50">
                  <tr>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Image</TableHead>
                    <TableHead align="right">Actions</TableHead>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredProducts.length ? (
                    filteredProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <ProductThumbnail product={product} />
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-gray-950">
                                {product.name}
                              </p>
                              <p className="text-xs text-gray-500">{product.slug}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {product.category?.name || "Uncategorized"}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-950">
                          {currencyFormatter.format(getNumber(product.price))}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getStockClassName(
                              product.stock
                            )}`}
                          >
                            {product.stock} in stock
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {product.image ? (
                            <span className="text-green-700">Set</span>
                          ) : (
                            <span className="text-gray-400">None</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenModal(product)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 transition hover:bg-gray-100 hover:text-gray-950 border border-gray-100"
                              aria-label={`Edit ${product.name}`}
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(product)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-red-600 transition hover:bg-red-50 hover:text-red-700 border border-red-100"
                              aria-label={`Delete ${product.name}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-16 text-center text-xs font-medium text-gray-500">
                        {query ? "No active products match your search criteria." : "No registered products inside catalog database."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* Modern Modal Box Popup */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-2xl border border-gray-200 py-1">
            <div className="flex items-center justify-between border-b border-gray-100 p-6">
              <div>
                <h2 className="text-xl font-serif font-black tracking-tight text-gray-950">
                  {editingProduct ? "Modify Product Details" : "Create New Product"}
                </h2>
                <p className="mt-1.5 text-[10px] text-gray-400 font-medium">
                  All slugs, indexing paths, and search arrays are updated dynamically on save.
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
              <div className="grid grid-cols-1 gap-4.5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="name" className="mb-2 block text-xs font-bold text-gray-700 uppercase tracking-wide">
                    Product Title
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    minLength={2}
                    maxLength={100}
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-xs font-medium text-gray-950 outline-none transition focus:border-gray-950 focus:ring-2 focus:ring-gray-950/5"
                    placeholder="e.g. Minimal European Linen Blazer"
                  />
                </div>

                <div>
                  <label htmlFor="price" className="mb-2 block text-xs font-bold text-gray-700 uppercase tracking-wide">
                    Selling Price (USD)
                  </label>
                  <input
                    id="price"
                    name="price"
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-xs font-medium text-gray-950 outline-none transition focus:border-gray-950 focus:ring-2 focus:ring-gray-950/5"
                    placeholder="129.00"
                  />
                </div>

                <div>
                  <label htmlFor="stock" className="mb-2 block text-xs font-bold text-gray-700 uppercase tracking-wide">
                    Stock Quantity
                  </label>
                  <input
                    id="stock"
                    name="stock"
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={formData.stock}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-xs font-medium text-gray-900 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-950/5"
                    placeholder="50"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="categoryId"
                    className="mb-2 block text-xs font-bold text-gray-700 uppercase tracking-wide"
                  >
                    Parent Category
                  </label>
                  <select
                    id="categoryId"
                    name="categoryId"
                    required
                    value={formData.categoryId}
                    onChange={handleChange}
                    className="h-11 w-full rounded-lg border border-gray-200 bg-white px-4 text-xs font-medium text-gray-900 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-950/5"
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="mb-2 block text-xs font-bold text-gray-700 uppercase tracking-wide"
                >
                  Product Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  required
                  minLength={5}
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-xs font-medium text-gray-900 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-950/5"
                  placeholder="Draft editorial descriptions, organic textures, materials, sizing, and details..."
                />
              </div>

              <div>
                <label htmlFor="image" className="mb-2 block text-xs font-bold text-gray-700 uppercase tracking-wide">
                  Image Source URL
                </label>
                <input
                  id="image"
                  name="image"
                  type="url"
                  value={formData.image}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-xs font-medium text-gray-900 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-950/5"
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
                <button
                  type="submit"
                  disabled={saving}
                  className="h-11 rounded-lg bg-gray-950 px-6 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Saving product..."
                    : editingProduct
                      ? "Update Product"
                      : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
      className={`px-6 py-3 text-xs font-semibold uppercase text-gray-500 ${align === "right" ? "text-right" : "text-left"
        }`}
    >
      {children}
    </th>
  );
}

function ProductThumbnail({ product }: { product: Product }) {
  if (!product.image) {
    return (
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gray-50 border border-gray-200 text-gray-400">
        <ImageIcon className="h-4.5 w-4.5" />
      </div>
    );
  }

  return (
    <div
      className="h-11 w-11 shrink-0 rounded-lg bg-gray-50 bg-cover bg-center border border-gray-200"
      style={{ backgroundImage: `url("${product.image}")` }}
      aria-label={product.name}
    />
  );
}
