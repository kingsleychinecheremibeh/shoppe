"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AlertBanner, EmptyState } from "@/app/components/feedback";
import { ProductCard } from "@/app/components/product-card";
import { api } from "@/lib/api";

type Category = {
  id: string;
  name: string;
  slug: string;
};

type Product = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number | string;
  image?: string | null;
  stock: number;
  category?: Category;
  images?: ProductGalleryImage[];
};

type ProductGalleryImage = {
  id: string;
  url: string;
  isPrimary: boolean;
  color?: string | null;
};

export type CatalogInitialData = {
  products: Product[];
  categories: Category[];
  totalItems: number;
  totalPages: number;
};

export function ProductCatalog({ initialData = null }: { initialData?: CatalogInitialData | null }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>(initialData?.products ?? []);
  const [categories, setCategories] = useState<Category[]>(initialData?.categories ?? []);
  const [loading, setLoading] = useState(!initialData);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const [loadError, setLoadError] = useState("");

  // Filters come from the URL, so the first render matches what the server already loaded.
  const urlSearch = searchParams.get("search") || "";
  const urlCategory = searchParams.get("category") || "all";
  const urlSort = searchParams.get("sort") || "default";

  const [selectedCategory, setSelectedCategory] = useState<string>(urlCategory);
  const [sortBy, setSortBy] = useState<string>(urlSort === "newest" ? "default" : urlSort);
  const [searchInput, setSearchInput] = useState<string>(urlSearch);
  const [searchQuery, setSearchQuery] = useState<string>(urlSearch);

  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(initialData?.totalPages ?? 1);
  const [totalItems, setTotalItems] = useState(initialData?.totalItems ?? 0);

  // Skip the first browser fetch when the server already provided the same data.
  const skipInitialProductsFetch = useRef(Boolean(initialData));

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchInput(urlSearch);
      setSearchQuery(urlSearch);
      setPage(1);
    }, 0);
    return () => clearTimeout(timer);
  }, [urlSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSelectedCategory(urlCategory);
      setPage(1);
    }, 0);
    return () => clearTimeout(timer);
  }, [urlCategory]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSortBy(urlSort === "newest" ? "default" : urlSort);
      setPage(1);
    }, 0);
    return () => clearTimeout(timer);
  }, [urlSort]);

  // Find current category name and description for header block
  const currentCategoryName = useMemo(() => {
    if (selectedCategory === "all") return "Shop all";
    const found = categories.find((c) => c.slug.toLowerCase() === selectedCategory.toLowerCase());
    return found ? found.name : "Shop all";
  }, [selectedCategory, categories]);

  const currentCategoryDesc = useMemo(() => {
    if (selectedCategory === "all") return "Everything in store.";
    const found = categories.find((c) => c.slug.toLowerCase() === selectedCategory.toLowerCase());
    return found ? `All ${found.name.toLowerCase()} in store.` : "Everything in store.";
  }, [selectedCategory, categories]);

  // Load Categories once on mount (unless the server already sent them)
  useEffect(() => {
    if (initialData?.categories?.length) return;
    const fetchCategories = async () => {
      try {
        const categoriesData = await api.getCategories();
        setCategories((categoriesData as Category[]) || []);
      } catch {}
    };
    fetchCategories();
  }, [initialData]);

  // Fetch paginated products on page/filter change
  useEffect(() => {
    if (skipInitialProductsFetch.current) {
      skipInitialProductsFetch.current = false;
      return;
    }

    const fetchProducts = async () => {
      try {
        setLoadError("");
        setLoading(true);
        const productsResponse = (await api.getProducts({
          page: String(page),
          limit: "12",
          category: selectedCategory,
          search: searchQuery,
          sort: sortBy,
        })) as { data: Product[]; meta: { totalPages: number; totalItems: number } };

        setProducts(productsResponse.data || []);
        setTotalPages(productsResponse.meta?.totalPages || 1);
        setTotalItems(productsResponse.meta?.totalItems || 0);
      } catch {
        setLoadError("Unable to load products. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [page, selectedCategory, searchQuery, sortBy]);

  const handleAddToCart = async (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();

    if (product.stock <= 0) {
      toast.error("This product is currently out of stock.");
      return;
    }

    try {
      setAddingToCart(product.id);
      const primaryImage = product.images?.find((img) => img.isPrimary) || product.images?.[0];
      await api.addToCart(product.id, 1, primaryImage?.color || undefined, primaryImage?.id || undefined);
      toast.success(`${product.name} added to cart!`);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("cart-updated"));
      }
    } catch {
      toast.error("Please login to add items to your cart.");
      router.push("/login");
    } finally {
      setAddingToCart(null);
    }
  };

  // Serve backend filtered products directly
  const filteredProducts = products;

  const clearFilters = () => {
    setSelectedCategory("all");
    setSortBy("default");
    setSearchInput("");
    setSearchQuery("");
    setPage(1);
    router.replace("/products");
  };

  const handleSearch = () => {
    setSearchQuery(searchInput.trim());
    setPage(1);
  };

  const hasActiveFilters = selectedCategory !== "all" || searchQuery !== "" || sortBy !== "default";

  const pillClass = (active: boolean) =>
    `shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
      active
        ? "bg-gray-950 text-white"
        : "bg-white text-gray-700 ring-1 ring-gray-200 hover:ring-gray-400"
    }`;

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-gray-950 sm:text-4xl">
              {currentCategoryName}
            </h1>
            <p className="mt-2 text-sm text-gray-500">{currentCategoryDesc}</p>
          </div>

          <form
            className="relative w-full md:hidden"
            onSubmit={(event) => {
              event.preventDefault();
              handleSearch();
            }}
          >
            <label htmlFor="productSearch" className="sr-only">
              Search products
            </label>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              id="productSearch"
              name="productSearch"
              type="search"
              placeholder="Search products"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="h-11 w-full rounded-full border border-gray-200 bg-white pl-11 pr-4 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-gray-400 focus:ring-4 focus:ring-brand/10"
            />
          </form>
        </div>

        {/* Toolbar */}
        <div className="mt-8 flex flex-col gap-4 border-b border-gray-100 pb-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
            <button
              type="button"
              onClick={() => { setSelectedCategory("all"); setPage(1); }}
              className={pillClass(selectedCategory === "all")}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                type="button"
                key={category.id}
                onClick={() => { setSelectedCategory(category.slug); setPage(1); }}
                className={pillClass(selectedCategory === category.slug)}
              >
                {category.name}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between gap-4 lg:justify-end">
            <p className="text-sm text-gray-500">
              {loading ? "Loading…" : `${totalItems} ${totalItems === 1 ? "product" : "products"}`}
            </p>
            <div className="flex items-center gap-3">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-sm font-medium text-gray-500 underline-offset-4 transition hover:text-gray-950 hover:underline"
                >
                  Clear
                </button>
              )}
              <label htmlFor="productSort" className="sr-only">
                Sort products
              </label>
              <select
                id="productSort"
                name="productSort"
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                className="h-10 rounded-full border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition focus:border-gray-400"
              >
                <option value="default">Newest</option>
                <option value="price-asc">Price: low to high</option>
                <option value="price-desc">Price: high to low</option>
                <option value="name-asc">Name: A–Z</option>
                <option value="name-desc">Name: Z–A</option>
              </select>
            </div>
          </div>
        </div>

        {loadError ? (
          <div className="mt-6">
            <AlertBanner variant="error" message={loadError} />
          </div>
        ) : null}

        {/* Grid */}
        <div className="mt-8">
          {loading ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4">
              {[...Array(8)].map((_, i) => (
                <div key={i}>
                  <div className="aspect-4/5 animate-pulse rounded-2xl bg-gray-100" />
                  <div className="mt-3 h-4 w-2/3 animate-pulse rounded bg-gray-100" />
                  <div className="mt-2 h-4 w-1/3 animate-pulse rounded bg-gray-100" />
                </div>
              ))}
            </div>
          ) : filteredProducts.length ? (
            <>
              <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4">
                {filteredProducts.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    priority={index < 4}
                    action={
                      product.stock > 0 ? (
                        <button
                          type="button"
                          onClick={(e) => handleAddToCart(e, product)}
                          disabled={addingToCart === product.id}
                          aria-label={`Add ${product.name} to cart`}
                          className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-900 shadow-md transition hover:bg-brand hover:text-white focus-visible:opacity-100 disabled:opacity-60 sm:opacity-0 sm:group-hover:opacity-100"
                        >
                          {addingToCart === product.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Plus className="h-5 w-5" />
                          )}
                        </button>
                      ) : null
                    }
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <nav className="mt-14 flex items-center justify-center gap-2" aria-label="Pagination">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="inline-flex h-10 items-center rounded-full px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>
                  {[...Array(totalPages)].map((_, index) => {
                    const pageNum = index + 1;
                    return (
                      <button
                        type="button"
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        aria-current={page === pageNum ? "page" : undefined}
                        className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition ${
                          page === pageNum ? "bg-gray-950 text-white" : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="inline-flex h-10 items-center rounded-full px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </nav>
              )}
            </>
          ) : (
            <EmptyState
              title="No products found"
              message="Try a different search or category."
              action={
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center justify-center rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-white transition hover:bg-brand-hover"
                >
                  Clear filters
                </button>
              }
            />
          )}
        </div>
      </div>
    </main>
  );
}
