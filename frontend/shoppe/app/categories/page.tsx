"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Grid3X3, Search } from "lucide-react";
import { ProductImage } from "@/app/components/product-image";
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
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <Link
              href="/products"
              className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 transition hover:text-gray-950"
            >
              <ArrowLeft className="h-4 w-4" />
              Shop all
            </Link>
            <h1 className="text-3xl font-semibold tracking-tight text-gray-950 sm:text-4xl">Categories</h1>
            <p className="mt-2 text-sm text-gray-500">Find what you need faster by browsing a category.</p>
          </div>

          {categories.length > 6 && (
            <div className="relative w-full md:w-80">
              <label htmlFor="categorySearch" className="sr-only">
                Search categories
              </label>
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                id="categorySearch"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search categories"
                className="h-11 w-full rounded-full border border-gray-200 bg-white pl-11 pr-4 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-gray-400 focus:ring-4 focus:ring-brand/10"
              />
            </div>
          )}
        </div>

        <div className="mt-10">
          {loading ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i}>
                  <div className="aspect-4/5 animate-pulse rounded-2xl bg-gray-100" />
                  <div className="mt-3 h-4 w-1/2 animate-pulse rounded bg-gray-100" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-3xl bg-canvas px-6 py-20 text-center">
              <Grid3X3 className="mb-4 h-8 w-8 text-gray-300" />
              <h2 className="text-lg font-semibold text-gray-950">
                {searchQuery ? "No matching categories" : "No categories yet"}
              </h2>
              <p className="mt-1 max-w-sm text-sm text-gray-500">
                {searchQuery ? "Try a different search." : "Categories will appear here soon."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4">
              {filtered.map((category) => {
                const imageUrl = getAssetUrl(category.image);

                return (
                  <Link key={category.id} href={`/category/${category.slug}`} className="group block">
                    <div className="relative aspect-4/5 overflow-hidden rounded-2xl bg-canvas">
                      {imageUrl ? (
                        <ProductImage
                          src={imageUrl}
                          alt=""
                          fill
                          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                          sizes="(max-width: 640px) 50vw, 25vw"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-gray-300">
                          <Grid3X3 className="h-8 w-8" />
                        </div>
                      )}
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">{category.name}</h3>
                        {typeof category.activeProductCount === "number" && (
                          <p className="text-xs text-gray-500">
                            {category.activeProductCount}{" "}
                            {category.activeProductCount === 1 ? "product" : "products"}
                          </p>
                        )}
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0 text-gray-400 transition group-hover:translate-x-0.5 group-hover:text-brand" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
