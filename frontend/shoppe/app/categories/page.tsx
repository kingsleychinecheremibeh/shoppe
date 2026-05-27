"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Grid3X3, Search } from "lucide-react";
import { api, getAssetUrl } from "@/lib/api";

type Category = {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
  activeProductCount?: number;
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await api.getCategories();
        setCategories((data as Category[]) || []);
      } catch {
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    void fetchCategories();
  }, []);

  const filtered = searchQuery.trim()
    ? categories.filter((c) =>
        c.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
      )
    : categories;

  return (
    <main className="min-h-screen bg-gray-50/50">
      {/* Hero Header */}
      <section className="border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <Link
            href="/products"
            className="mb-6 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-500 transition hover:text-gray-950"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to Shop
          </Link>

          <h1 className="text-3xl font-serif font-black tracking-tight text-gray-950 sm:text-4xl">
            Browse Categories
          </h1>
          <p className="mt-3 max-w-xl text-sm font-medium leading-relaxed text-gray-500">
            Explore our curated collections. Find exactly what you are looking
            for by browsing through our product categories.
          </p>

          {/* Search */}
          {categories.length > 6 && (
            <div className="mt-6 max-w-sm">
              <label htmlFor="categorySearch" className="relative block">
                <span className="sr-only">Search categories</span>
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <input
                  id="categorySearch"
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search categories..."
                  className="h-11 w-full rounded-full border border-gray-200 bg-gray-50/50 pl-10 pr-4 text-xs font-medium text-gray-950 outline-none transition duration-300 focus:border-gray-950 focus:bg-white focus:ring-2 focus:ring-gray-950/5"
                />
              </label>
            </div>
          )}
        </div>
      </section>

      {/* Categories Grid */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-gray-950" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-gray-400 mb-5">
              <Grid3X3 className="h-7 w-7" />
            </div>
            <h2 className="text-lg font-serif font-bold text-gray-950">
              {searchQuery ? "No categories found" : "No categories yet"}
            </h2>
            <p className="mt-2 max-w-sm text-xs font-medium text-gray-500 leading-relaxed">
              {searchQuery
                ? "Try searching with a different keyword."
                : "Categories will appear here once the store admin creates them."}
            </p>
          </div>
        ) : (
          <>
            <p className="mb-6 text-[10px] font-bold uppercase tracking-widest text-gray-500">
              {filtered.length} {filtered.length === 1 ? "Category" : "Categories"}
            </p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {filtered.map((category) => {
                const imageUrl = getAssetUrl(category.image);

                return (
                  <Link
                    key={category.id}
                    href={`/category/${category.slug}`}
                    className="group relative flex flex-col overflow-hidden rounded-xl border border-gray-200/80 bg-white shadow-xs transition-all duration-300 hover:shadow-lg hover:border-gray-300 hover:-translate-y-0.5"
                  >
                    {/* Image */}
                    <div className="relative aspect-square w-full overflow-hidden bg-gray-100">
                      {imageUrl ? (
                        <div
                          className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                          style={{ backgroundImage: `url("${imageUrl}")` }}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 text-gray-300 transition-colors group-hover:text-gray-400">
                          <Grid3X3 className="h-10 w-10" />
                        </div>
                      )}

                      {/* Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-950/20 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    </div>

                    {/* Label */}
                    <div className="flex flex-col items-center px-3 py-3.5">
                      <h3 className="text-center text-xs font-bold text-gray-800 transition-colors group-hover:text-gray-950 line-clamp-2">
                        {category.name}
                      </h3>
                      {typeof category.activeProductCount === "number" && (
                        <span className="mt-1 text-[10px] font-medium text-gray-400">
                          {category.activeProductCount}{" "}
                          {category.activeProductCount === 1 ? "product" : "products"}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
