"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, ShoppingCart, Eye, AlertCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { api, getAssetUrl } from "@/lib/api";

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
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "NGN",
});

function ProductCatalogContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);

  // Filters State
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("default");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Sync Search Query and Filters from URL SearchParams
  const urlSearch = searchParams.get("search") || "";
  const urlCategory = searchParams.get("category") || "all";
  const urlSort = searchParams.get("sort") || "default";

  useEffect(() => {
    const timer = setTimeout(() => {
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
    if (selectedCategory === "all") return "Shop Collection";
    const found = categories.find((c) => c.slug.toLowerCase() === selectedCategory.toLowerCase());
    return found ? `${found.name} Collection` : "Shop Collection";
  }, [selectedCategory, categories]);

  const currentCategoryDesc = useMemo(() => {
    if (selectedCategory === "all") return "Browse through our highly curated collection of high-quality products.";
    const found = categories.find((c) => c.slug.toLowerCase() === selectedCategory.toLowerCase());
    return found ? `Browse our curated collection of premium ${found.name.toLowerCase()} items.` : "Browse through our highly curated collection of high-quality products.";
  }, [selectedCategory, categories]);

  // Load Categories once on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesData = await api.getCategories();
        setCategories((categoriesData as Category[]) || []);
      } catch {}
    };
    fetchCategories();
  }, []);

  // Fetch paginated products on page/filter change
  useEffect(() => {
    const fetchProducts = async () => {
      try {
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
        toast.error("Unable to load products. Please try again.");
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
      await api.addToCart(product.id, 1);
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
    setSearchQuery("");
    setPage(1);
    router.replace("/products");
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="h-8 w-48 animate-pulse rounded bg-gray-200 mb-6" />
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
            <aside className="space-y-6 hidden lg:block">
              <div className="h-40 animate-pulse rounded bg-gray-200" />
            </aside>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-96 animate-pulse rounded-lg bg-gray-200" />
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Header Block */}
        <div className="mb-8 border-b border-gray-200 pb-5">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-950">{currentCategoryName}</h1>
          <p className="mt-2 text-sm text-gray-600">
            {currentCategoryDesc}
          </p>
        </div>

        {/* Catalog Layout */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[260px_1fr]">
          
          {/* Sidebar Filters */}
          <aside className="space-y-8">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-900 mb-4">Search</h3>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                  className="w-full rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-sm text-gray-900 placeholder-gray-500 focus:border-gray-950 focus:outline-none focus:ring-1 focus:ring-gray-950"
                />
                <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-900 mb-4">Categories</h3>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => { setSelectedCategory("all"); setPage(1); }}
                  className={`text-left px-3 py-2 rounded-md text-sm font-medium transition ${
                    selectedCategory === "all"
                      ? "bg-gray-950 text-white"
                      : "text-gray-600 hover:bg-gray-200 hover:text-gray-950"
                  }`}
                >
                  All Products
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => { setSelectedCategory(category.slug); setPage(1); }}
                    className={`text-left px-3 py-2 rounded-md text-sm font-medium transition ${
                      selectedCategory === category.slug
                        ? "bg-gray-950 text-white"
                        : "text-gray-600 hover:bg-gray-200 hover:text-gray-950"
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-900 mb-4">Sort By</h3>
              <select
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm text-gray-900 focus:border-gray-950 focus:outline-none focus:ring-1 focus:ring-gray-950"
              >
                <option value="default">Newest Arrivals</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name-asc">Name: A-Z</option>
                <option value="name-desc">Name: Z-A</option>
              </select>
            </div>

            {(selectedCategory !== "all" || searchQuery !== "" || sortBy !== "default") && (
              <button
                onClick={clearFilters}
                className="w-full rounded-md border border-gray-300 bg-white py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:text-gray-950 transition"
              >
                Clear All Filters
              </button>
            )}
          </aside>

          {/* Product Listing Main Grid */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-gray-600">
                Showing <span className="font-semibold text-gray-950">{totalItems}</span> products
              </p>
            </div>

            {filteredProducts.length ? (
              <>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredProducts.map((product) => {
                  const isOutOfStock = product.stock <= 0;
                  const imageUrl = getAssetUrl(product.image);
                  return (
                    <div
                      key={product.id}
                      className="group relative flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs transition duration-300 hover:shadow-md"
                    >
                      {/* Product Image Area */}
                      <div className="aspect-square w-full overflow-hidden bg-gray-100 relative block">
                        <Link href={`/products/${product.id}`} className="block h-full w-full">
                          {imageUrl ? (
                            <Image
                              src={imageUrl}
                              alt={product.name}
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                              width={400}
                              height={400}
                              priority
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-gray-400">
                              No image
                            </div>
                          )}
                        </Link>

                        {isOutOfStock && (
                          <div className="absolute top-3 left-3 bg-red-600 text-white text-[11px] font-bold uppercase tracking-wider px-2 py-1 rounded z-10">
                            Sold Out
                          </div>
                        )}

                        {/* Hover Overlay Actions */}
                        <div className="absolute inset-0 flex items-center justify-center gap-3 bg-black/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100 z-10">
                          <Link
                            href={`/products/${product.id}`}
                            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-900 shadow-md transition hover:bg-gray-950 hover:text-white"
                            title="View Details"
                          >
                            <Eye className="h-5 w-5" />
                          </Link>
                          {!isOutOfStock && (
                            <button
                              onClick={(e) => handleAddToCart(e, product)}
                              disabled={addingToCart === product.id}
                              className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-900 shadow-md transition hover:bg-gray-950 hover:text-white disabled:opacity-50"
                              title="Add to Cart"
                            >
                              <ShoppingCart className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Product Info Block */}
                      <div className="flex flex-1 flex-col p-5">
                        <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-1">
                          {product.category?.name || "Uncategorized"}
                        </span>
                        <Link href={`/products/${product.id}`} className="hover:underline">
                          <h3 className="font-bold text-gray-950 line-clamp-1 text-base">{product.name}</h3>
                        </Link>
                        <p className="mt-1 text-sm text-gray-500 line-clamp-2 flex-1">{product.description || "Premium quality craftsmanship, styled for the modern lifestyle."}</p>
                        
                        <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
                          <p className="text-lg font-black text-gray-950">
                            {currencyFormatter.format(Number(product.price))}
                          </p>

                          {!isOutOfStock ? (
                            <button
                              onClick={(e) => handleAddToCart(e, product)}
                              disabled={addingToCart === product.id}
                              className="inline-flex items-center gap-1.5 bg-gray-950 px-3 py-2 text-xs font-semibold text-white rounded-md transition hover:bg-gray-800 disabled:opacity-50"
                            >
                              {addingToCart === product.id ? "Adding..." : "Add to Cart"}
                            </button>
                          ) : (
                            <span className="text-xs font-bold text-red-600 uppercase">Out of Stock</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="mt-12 flex items-center justify-center gap-3 border-t border-gray-100 pt-8">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="inline-flex h-9 items-center justify-center rounded-lg border border-gray-200 bg-white px-4 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 hover:text-gray-950 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Previous
                  </button>
                  
                  <div className="flex items-center gap-1.5">
                    {[...Array(totalPages)].map((_, index) => {
                      const pageNum = index + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`inline-flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold transition ${
                            page === pageNum
                              ? "bg-gray-950 text-white"
                              : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-950"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="inline-flex h-9 items-center justify-center rounded-lg border border-gray-200 bg-white px-4 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 hover:text-gray-950 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
              <div className="rounded-xl border border-dashed border-gray-300 p-16 text-center">
                <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                <h3 className="text-lg font-bold text-gray-950 mb-1">No products found</h3>
                <p className="text-sm text-gray-500 mb-6">We couldn&apos;t find any products matching your current filters.</p>
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center justify-center rounded-md bg-gray-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
                >
                  Reset all filters
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </main>
  );
}

export default function ProductCatalogPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gray-50 py-12 flex items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-black" />
      </main>
    }>
      <ProductCatalogContent />
    </Suspense>
  );
}
