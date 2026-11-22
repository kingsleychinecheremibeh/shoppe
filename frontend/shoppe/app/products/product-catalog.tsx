"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, ArrowLeft01Icon, ArrowRight01Icon, Loading03Icon, Search01Icon, ShoppingBag01Icon } from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import { AlertBanner, EmptyState } from "@/app/components/feedback";
import { ProductCard } from "@/app/components/product-card";
import { api } from "@/lib/api";
import { notifyCartUpdated, openCart } from "@/lib/cart-events";
import { getCategoryTheme } from "@/lib/category-colors";

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
      notifyCartUpdated();
      openCart({ addedName: product.name });
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

  const activeCategory = categories.find((c) => c.slug.toLowerCase() === selectedCategory.toLowerCase());
  const activeTheme = activeCategory ? getCategoryTheme(activeCategory) : null;

  const chipClass = (active: boolean) =>
    `inline-flex h-11 shrink-0 items-center gap-2 rounded-lg border-[1.5px] border-ink px-3.5 text-[15px] font-medium transition ${
      active ? "bg-ink text-paper" : "bg-white text-ink hover:shadow-sticker-sm hover:-translate-x-px hover:-translate-y-px"
    }`;

  const selectCategory = (slug: string) => {
    setSelectedCategory(slug);
    setPage(1);
  };

  return (
    <main className="min-h-screen">
      {/* Header band: takes the colour of the selected category */}
      <section
        className="border-b-[1.5px] border-ink"
        style={activeTheme ? { background: activeTheme.solid, color: activeTheme.onSolid } : { background: "#FFF1C2" }}
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-end md:justify-between lg:px-8 lg:py-12">
          <div className="flex items-center gap-5">
            <span className="hidden h-20 w-20 shrink-0 items-center justify-center rounded-lg border-[1.5px] border-ink bg-white text-ink sm:flex">
              <HugeiconsIcon icon={activeTheme?.icon || ShoppingBag01Icon} size={48} strokeWidth={1.4} />
            </span>
            <div>
              <h1 className="text-5xl leading-none font-extrabold tracking-[-0.04em] sm:text-6xl">{currentCategoryName}</h1>
              <p className="mt-2 text-base opacity-90">{currentCategoryDesc}</p>
            </div>
          </div>

          <form
            className="w-full md:max-w-sm"
            role="search"
            onSubmit={(event) => {
              event.preventDefault();
              handleSearch();
            }}
          >
            <label htmlFor="productSearch" className="flex h-12 items-center gap-2.5 rounded-lg border-[1.5px] border-ink bg-white px-3.5 text-ink focus-within:shadow-sticker-sm">
              <span className="sr-only">Search products</span>
              <HugeiconsIcon icon={Search01Icon} size={24} strokeWidth={1.6} className="shrink-0" />
              <input
                id="productSearch"
                name="productSearch"
                type="search"
                placeholder="Search this shop"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full min-w-0 bg-transparent text-[15px] outline-none placeholder:text-gray-500"
              />
            </label>
          </form>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Toolbar */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pt-1 pb-2 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
            <button type="button" onClick={() => selectCategory("all")} className={chipClass(selectedCategory === "all")} aria-pressed={selectedCategory === "all"}>
              All
            </button>
            {categories.map((category) => {
              const theme = getCategoryTheme(category);
              const active = selectedCategory === category.slug;
              return (
                <button type="button" key={category.id} onClick={() => selectCategory(category.slug)} className={chipClass(active)} aria-pressed={active}>
                  <span className="h-3 w-3 rounded-[3px] border border-ink" style={{ background: theme.solid }} aria-hidden="true" />
                  {category.name}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between gap-4 lg:justify-end">
            <p className="font-mono text-sm font-medium text-gray-700" aria-live="polite">
              {loading ? "Loading…" : `${totalItems} ${totalItems === 1 ? "product" : "products"}`}
            </p>
            <div className="flex items-center gap-3">
              {hasActiveFilters && (
                <button type="button" onClick={clearFilters} className="text-[15px] font-medium underline-offset-4 hover:underline">
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
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPage(1);
                }}
                className="h-11 rounded-lg border-[1.5px] border-ink bg-white px-3 text-[15px] font-medium text-ink outline-none"
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
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4">
              {[...Array(8)].map((_, i) => (
                <div key={i}>
                  <div className="aspect-4/5 animate-pulse rounded-lg border-[1.5px] border-gray-300 bg-canvas" />
                  <div className="mt-3 h-4 w-2/3 animate-pulse rounded bg-canvas" />
                  <div className="mt-2 h-4 w-1/3 animate-pulse rounded bg-canvas" />
                </div>
              ))}
            </div>
          ) : filteredProducts.length ? (
            <>
              <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4">
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
                          className="flex h-11 w-11 items-center justify-center rounded-lg border-[1.5px] border-ink bg-white text-ink transition hover:bg-sun focus-visible:opacity-100 disabled:opacity-60 sm:opacity-0 sm:group-hover:opacity-100"
                        >
                          <HugeiconsIcon
                            icon={addingToCart === product.id ? Loading03Icon : Add01Icon}
                            size={24}
                            strokeWidth={1.8}
                            className={addingToCart === product.id ? "animate-spin" : ""}
                          />
                        </button>
                      ) : null
                    }
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <nav className="mt-14 flex flex-wrap items-center justify-center gap-2" aria-label="Pagination">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    aria-label="Previous page"
                    className="flex h-11 w-11 items-center justify-center rounded-lg border-[1.5px] border-ink bg-white transition hover:bg-sun disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <HugeiconsIcon icon={ArrowLeft01Icon} size={22} strokeWidth={1.8} />
                  </button>
                  {[...Array(totalPages)].map((_, index) => {
                    const pageNum = index + 1;
                    return (
                      <button
                        type="button"
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        aria-current={page === pageNum ? "page" : undefined}
                        className={`flex h-11 w-11 items-center justify-center rounded-lg border-[1.5px] border-ink font-mono text-[15px] font-semibold transition ${
                          page === pageNum ? "bg-ink text-paper" : "bg-white hover:bg-sun"
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
                    aria-label="Next page"
                    className="flex h-11 w-11 items-center justify-center rounded-lg border-[1.5px] border-ink bg-white transition hover:bg-sun disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <HugeiconsIcon icon={ArrowRight01Icon} size={22} strokeWidth={1.8} />
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
                  className="inline-flex h-12 items-center justify-center rounded-lg bg-ink px-6 text-[15px] font-semibold text-paper transition hover:bg-black"
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
