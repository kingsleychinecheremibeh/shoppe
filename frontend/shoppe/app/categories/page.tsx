"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft02Icon, ArrowRight02Icon, GridViewIcon, Search01Icon } from "@hugeicons/core-free-icons";
import { ProductImage } from "@/app/components/product-image";
import { api, getAssetUrl } from "@/lib/api";
import { getCategoryTheme } from "@/lib/category-colors";

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
    ? categories.filter((c) => c.name.toLowerCase().includes(searchQuery.trim().toLowerCase()))
    : categories;

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <Link
              href="/products"
              className="mb-4 inline-flex items-center gap-2 text-[15px] font-medium underline-offset-4 hover:underline"
            >
              <HugeiconsIcon icon={ArrowLeft02Icon} size={22} strokeWidth={1.8} />
              Shop all
            </Link>
            <h1 className="text-6xl leading-none font-extrabold tracking-[-0.045em] sm:text-7xl">Categories</h1>
            <p className="mt-3 text-lg text-gray-700">Find what you need faster by browsing a category.</p>
          </div>

          {categories.length > 6 && (
            <label htmlFor="categorySearch" className="flex h-12 w-full items-center gap-2.5 rounded-lg border-[1.5px] border-ink bg-white px-3.5 md:w-80">
              <span className="sr-only">Search categories</span>
              <HugeiconsIcon icon={Search01Icon} size={24} strokeWidth={1.6} className="shrink-0" />
              <input
                id="categorySearch"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search categories"
                className="w-full min-w-0 bg-transparent text-[15px] outline-none placeholder:text-gray-500"
              />
            </label>
          )}
        </div>

        <div className="mt-10">
          {loading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-56 animate-pulse rounded-lg border-[1.5px] border-gray-300 bg-canvas" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border-[1.5px] border-dashed border-ink px-6 py-20 text-center">
              <span className="mb-4 flex h-20 w-20 items-center justify-center rounded-lg border-[1.5px] border-ink bg-sun">
                <HugeiconsIcon icon={GridViewIcon} size={44} strokeWidth={1.4} />
              </span>
              <h2 className="text-3xl font-extrabold">{searchQuery ? "No matching categories" : "No categories yet"}</h2>
              <p className="mt-2 max-w-sm text-base text-gray-700">
                {searchQuery ? "Try a different search." : "Categories will appear here soon."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((category) => {
                const imageUrl = getAssetUrl(category.image);
                const theme = getCategoryTheme(category);

                return (
                  <Link
                    key={category.id}
                    href={`/category/${category.slug}`}
                    className="sticker group relative flex min-h-56 overflow-hidden rounded-lg border-[1.5px] border-ink"
                    style={{ background: theme.solid, color: theme.onSolid }}
                  >
                    <div className="relative z-10 flex flex-1 flex-col justify-between gap-8 p-6">
                      <HugeiconsIcon icon={theme.icon} size={72} strokeWidth={1.3} />
                      <div className="flex items-end justify-between gap-3">
                        <div>
                          <h2 className="text-3xl leading-tight font-extrabold">{category.name}</h2>
                          {typeof category.activeProductCount === "number" && (
                            <p className="font-mono text-sm font-medium">
                              {category.activeProductCount} {category.activeProductCount === 1 ? "product" : "products"}
                            </p>
                          )}
                        </div>
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border-[1.5px] border-ink bg-white text-ink transition group-hover:bg-ink group-hover:text-paper">
                          <HugeiconsIcon icon={ArrowRight02Icon} size={24} strokeWidth={1.8} />
                        </span>
                      </div>
                    </div>
                    {imageUrl && (
                      <div className="relative hidden w-[42%] shrink-0 border-l-[1.5px] border-ink sm:block" style={{ background: theme.soft }}>
                        <ProductImage
                          src={imageUrl}
                          alt=""
                          fill
                          className="object-cover mix-blend-multiply transition-transform duration-500 group-hover:scale-[1.04]"
                          sizes="(max-width: 1024px) 25vw, 15vw"
                        />
                      </div>
                    )}
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
