"use client";

import { ChangeEvent, SyntheticEvent, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Edit, ImageIcon, Plus, Search, Star, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { AlertBanner, ConfirmModal, FieldError, LoadingButton } from "@/app/components/feedback";
import { api, getAssetUrl } from "@/lib/api";

type UserData = {
  id: string;
  name: string;
  email: string;
  role: "USER" | "MANAGER" | "ADMIN";
  managerPermissions?: string[];
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
  images?: ProductGalleryImage[];
};

type ProductGalleryImage = {
  id: string;
  url: string;
  publicId?: string | null;
  altText?: string | null;
  color?: string | null;
  sortOrder: number;
  isPrimary: boolean;
};

type ProductFormData = {
  name: string;
  description: string;
  price: string;
  stock: string;
  categoryId: string;
  image: string;
};

type UploadResponse = {
  url: string;
  publicId?: string;
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
  currency: "NGN",
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

const getProductFormData = (product: Product): ProductFormData => ({
  name: product.name,
  description: product.description || "",
  price: String(product.price),
  stock: String(product.stock ?? 0),
  categoryId: product.categoryId || product.category?.id || "",
  image: product.image || "",
});

const normalizeColor = (color: string) => color.trim().toLowerCase();

const getPrimaryGalleryImage = (product: Product) => {
  return product.images?.find((image) => image.isPrimary) || product.images?.[0];
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingGalleryImage, setUploadingGalleryImage] = useState(false);
  const [primaryImageId, setPrimaryImageId] = useState<string | null>(null);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);
  const [galleryColor, setGalleryColor] = useState("");
  const [query, setQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [formData, setFormData] = useState(initialFormData);
  const [fetchError, setFetchError] = useState("");
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof ProductFormData, string>>>({});

  const fetchProducts = async () => {
    try {
      setFetchError("");
      const me = (await api.getMe()) as MeResponse;

      const canManageProducts =
        me.user.role === "ADMIN" || me.user.managerPermissions?.includes("PRODUCT_MANAGEMENT");

      if (!canManageProducts) {
        toast.error("You need product management access to manage products.");
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
      const message = getErrorMessage(error, "Failed to fetch products.");
      setFetchError(message);
      toast.error(message);
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
      setFormData(getProductFormData(product));
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
    if (saving || uploadingGalleryImage || primaryImageId || deletingImageId) return;
    setShowModal(false);
    setEditingProduct(null);
    setFormData(initialFormData);
    setGalleryColor("");
    setFormErrors({});
  };

  const refreshProductImages = async (productId: string) => {
    await fetchProducts();
    const refreshed = (await api.getProduct(productId)) as Product;
    setEditingProduct(refreshed);
  };

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
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

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const result = (await api.uploadImage(file)) as UploadResponse;
      setFormData((current) => ({
        ...current,
        image: result.url,
      }));
      toast.success("Image uploaded successfully.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to upload image."));
    } finally {
      setUploadingImage(false);
      event.target.value = "";
    }
  };

  const handleGalleryImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !editingProduct) return;

    try {
      setUploadingGalleryImage(true);
      const result = (await api.uploadImage(file)) as UploadResponse;
      await api.addProductImage(editingProduct.id, {
        url: result.url,
        publicId: result.publicId,
        color: galleryColor.trim() || undefined,
        altText: editingProduct.name,
        sortOrder: editingProduct.images?.length ?? 0,
        isPrimary: !editingProduct.images?.length && !editingProduct.image,
      });
      toast.success("Gallery image added successfully.");
      setGalleryColor("");
      await refreshProductImages(editingProduct.id);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to add gallery image."));
    } finally {
      setUploadingGalleryImage(false);
      event.target.value = "";
    }
  };

  const handleSetPrimaryImage = async (image: ProductGalleryImage) => {
    if (!editingProduct) return;

    try {
      setPrimaryImageId(image.id);
      await api.setPrimaryProductImage(editingProduct.id, image.id);
      toast.success("Primary image updated.");
      await refreshProductImages(editingProduct.id);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to update primary image."));
    } finally {
      setPrimaryImageId(null);
    }
  };

  const handleDeleteGalleryImage = async (image: ProductGalleryImage) => {
    if (!editingProduct) return;

    try {
      setDeletingImageId(image.id);
      await api.deleteProductImage(editingProduct.id, image.id);
      toast.success("Gallery image deleted.");
      await refreshProductImages(editingProduct.id);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to delete gallery image."));
    } finally {
      setDeletingImageId(null);
    }
  };

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: Partial<Record<keyof ProductFormData, string>> = {};

    if (!formData.categoryId) {
      nextErrors.categoryId = "Select a category for this product.";
    }

    const price = Number(formData.price);
    const stock = Number(formData.stock);

    if (!Number.isFinite(price) || price <= 0) {
      nextErrors.price = "Price must be a positive number.";
    }

    if (!Number.isInteger(stock) || stock < 0) {
      nextErrors.stock = "Stock must be a non-negative whole number.";
    }

    const pendingGalleryColor = galleryColor.trim();
    const galleryColorImageUrl =
      formData.image.trim() ||
      (editingProduct ? getPrimaryGalleryImage(editingProduct)?.url : "");

    if (editingProduct && pendingGalleryColor && !galleryColorImageUrl) {
      nextErrors.image = "Add an image before saving a color.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setFormErrors(nextErrors);
      return;
    }

    setFormErrors({});
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

        if (pendingGalleryColor) {
          const colorAlreadyExists = editingProduct.images?.some((image) => {
            return image.color ? normalizeColor(image.color) === normalizeColor(pendingGalleryColor) : false;
          });

          if (!colorAlreadyExists) {
            await api.addProductImage(editingProduct.id, {
              url: galleryColorImageUrl,
              color: pendingGalleryColor,
              altText: editingProduct.name,
              sortOrder: editingProduct.images?.length ?? 0,
              isPrimary: !editingProduct.images?.length && !editingProduct.image,
            });
          }
        }

        toast.success("Product updated successfully.");
        setShowModal(false);
        setEditingProduct(null);
        setFormData(initialFormData);
        setGalleryColor("");
        setFormErrors({});
        await fetchProducts();
      } else {
        const createdProduct = (await api.createProduct(payload)) as Product;
        toast.success("Product created. Add color images below.");
        setEditingProduct(createdProduct);
        setFormData(getProductFormData(createdProduct));
        setGalleryColor("");
        await fetchProducts();
      }
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to save product."));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product: Product) => {
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
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-600">Inventory Catalog</span>
            <h1 className="mt-1.5 text-4xl font-serif font-black tracking-tight text-gray-950">Store Products</h1>
            <p className="mt-2 text-xs font-medium text-gray-500 max-w-lg leading-relaxed">
              Manage product listings, pricing edits, instant stock allocations, and shop taxonomy updates.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="relative block sm:w-80">
              <span className="sr-only">Search products</span>
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
              <input
                id="adminProductSearch"
                name="adminProductSearch"
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
          <div className="mb-6">
            <AlertBanner
              variant="warning"
              message="Please create at least one category before attempting to register new catalog products."
            />
          </div>
        )}

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
              <table className="w-full min-w-220">
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
                        <td className="px-6 py-4">
                          <ProductImageSummary product={product} />
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
                              onClick={() => setProductToDelete(product)}
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
                <p className="mt-1.5 text-[10px] text-gray-600 font-medium">
                  All slugs, indexing paths, and search arrays are updated dynamically on save.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="inline-flex h-8.5 w-8.5 items-center justify-center rounded-full text-gray-600 transition hover:bg-gray-100 hover:text-gray-950"
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
                    Selling Price (NGN)
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
                  <FieldError message={formErrors.price} />
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
                  <FieldError message={formErrors.stock} />
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
                  <FieldError message={formErrors.categoryId} />
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
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label htmlFor="image" className="block text-xs font-bold text-gray-700 uppercase tracking-wide">
                    Image Source
                  </label>
                  <label className="inline-flex h-8 cursor-pointer items-center rounded-lg border border-gray-200 bg-white px-3 text-[10px] font-bold uppercase tracking-wide text-gray-700 transition hover:bg-gray-50">
                    {uploadingImage ? "Uploading..." : "Upload File"}
                    <input
                      id="productImageUpload"
                      name="productImageUpload"
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleImageUpload}
                      disabled={uploadingImage || saving}
                      className="sr-only"
                    />
                  </label>
                </div>
                <input
                  id="image"
                  name="image"
                  type="text"
                  value={formData.image}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-xs font-medium text-gray-900 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-950/5"
                  placeholder="/uploads/image.webp or https://images.unsplash.com/photo-..."
                />
                <FieldError message={formErrors.image} />
              </div>

              {editingProduct && (
                <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4">
                  <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <label htmlFor="galleryColor" className="mb-2 block text-xs font-bold text-gray-700 uppercase tracking-wide">
                        Gallery Color
                      </label>
                      <input
                        id="galleryColor"
                        name="galleryColor"
                        type="text"
                        value={galleryColor}
                        onChange={(event) => setGalleryColor(event.target.value)}
                        className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs font-medium text-gray-900 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-950/5 sm:w-52"
                        placeholder="Black, Blue, Red..."
                      />
                    </div>
                    <label
                      className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-[10px] font-bold uppercase tracking-wide text-gray-700 transition hover:bg-gray-50 ${
                        uploadingGalleryImage || saving ? "cursor-not-allowed opacity-60" : "cursor-pointer"
                      }`}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      {uploadingGalleryImage ? "Uploading..." : "Add Gallery Image"}
                      <input
                        id="productGalleryImageUpload"
                        name="productGalleryImageUpload"
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={handleGalleryImageUpload}
                        disabled={uploadingGalleryImage || saving}
                        className="sr-only"
                      />
                    </label>
                  </div>

                  {editingProduct.images?.length ? (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {editingProduct.images.map((image) => {
                        const imageUrl = getAssetUrl(image.url);
                        const isSettingPrimary = primaryImageId === image.id;
                        const isDeleting = deletingImageId === image.id;
                        const actionDisabled =
                          uploadingGalleryImage ||
                          Boolean(primaryImageId) ||
                          Boolean(deletingImageId) ||
                          saving;

                        return (
                          <div key={image.id} className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                            <div className="relative aspect-square bg-gray-50">
                              {imageUrl ? (
                                <div
                                  className="h-full w-full bg-cover bg-center"
                                  style={{ backgroundImage: `url("${imageUrl}")` }}
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-gray-600">
                                  <ImageIcon className="h-5 w-5" />
                                </div>
                              )}
                              {image.isPrimary && (
                                <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-green-700 shadow-sm">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Primary
                                </span>
                              )}
                            </div>
                            <div className="space-y-2 p-2">
                              <div className="flex items-center justify-between gap-2">
                                <span className="truncate text-[10px] font-bold uppercase tracking-wide text-gray-600">
                                  {image.color || "Default"}
                                </span>
                                {image.isPrimary && <CheckCircle2 className="h-3.5 w-3.5 text-green-700" />}
                              </div>
                              <div className="flex gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleSetPrimaryImage(image)}
                                  disabled={image.isPrimary || actionDisabled}
                                  className="inline-flex h-7 flex-1 items-center justify-center rounded-md border border-gray-200 text-gray-600 transition hover:bg-gray-50 hover:text-gray-950 disabled:cursor-default disabled:opacity-40"
                                  aria-label="Set primary image"
                                >
                                  <Star className={`h-3.5 w-3.5 ${isSettingPrimary ? "animate-pulse" : ""}`} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteGalleryImage(image)}
                                  disabled={actionDisabled}
                                  className="inline-flex h-7 flex-1 items-center justify-center rounded-md border border-red-100 text-red-600 transition hover:bg-red-50"
                                  aria-label="Delete gallery image"
                                >
                                  <Trash2 className={`h-3.5 w-3.5 ${isDeleting ? "animate-pulse" : ""}`} />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-gray-200 bg-white px-4 py-6 text-center text-xs font-medium text-gray-500">
                      No gallery images
                    </div>
                  )}
                </div>
              )}

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
                  {editingProduct ? "Update Product" : "Create Product"}
                </LoadingButton>
              </div>
            </form>
          </div>
        </div>
      )}
      <ConfirmModal
        open={Boolean(productToDelete)}
        title="Delete product?"
        message={
          productToDelete
            ? `Delete "${productToDelete.name}"? This will remove it from the storefront.`
            : "This product will be removed from the storefront."
        }
        confirmLabel="Delete"
        onClose={() => setProductToDelete(null)}
        onConfirm={() => {
          if (!productToDelete) return;
          const product = productToDelete;
          setProductToDelete(null);
          void handleDelete(product);
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
      className={`px-6 py-3 text-xs font-semibold uppercase text-gray-500 ${align === "right" ? "text-right" : "text-left"
        }`}
    >
      {children}
    </th>
  );
}

function ProductImageSummary({ product }: { product: Product }) {
  const galleryCount = product.images?.length ?? 0;
  const primaryImage = product.images?.find((image) => image.isPrimary);

  if (galleryCount > 0) {
    return (
      <div className="space-y-1">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
          <CheckCircle2 className="h-3.5 w-3.5" />
          {galleryCount} {galleryCount === 1 ? "image" : "images"}
        </span>
        <p className="text-[10px] font-medium text-gray-500">
          {primaryImage ? "Primary selected" : "First image shown"}
        </p>
      </div>
    );
  }

  if (product.image) {
    return (
      <div className="space-y-1">
        <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
          Cover set
        </span>
        <p className="text-[10px] font-medium text-gray-500">Legacy fallback</p>
      </div>
    );
  }

  return <span className="text-sm text-gray-600">None</span>;
}

function ProductThumbnail({ product }: { product: Product }) {
  const primaryImage =
    product.images?.find((image) => image.isPrimary)?.url ||
    product.images?.[0]?.url ||
    product.image;
  const imageUrl = getAssetUrl(primaryImage);

  if (!imageUrl) {
    return (
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gray-50 border border-gray-200 text-gray-600">
        <ImageIcon className="h-4.5 w-4.5" />
      </div>
    );
  }

  return (
    <div
      className="h-11 w-11 shrink-0 rounded-lg bg-gray-50 bg-cover bg-center border border-gray-200"
      style={{ backgroundImage: `url("${imageUrl}")` }}
      aria-label={product.name}
    />
  );
}
