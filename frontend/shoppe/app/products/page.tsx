import type { Metadata } from "next";
import { Suspense } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Loading03Icon } from "@hugeicons/core-free-icons";
import { storeConfig } from "@/lib/store-config";
import { ProductCatalog, type CatalogInitialData } from "./product-catalog";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === "development" ? "http://localhost:5000/api/v1" : "");

export const metadata: Metadata = {
  title: "Shop all",
  description: `Shop clothing, shoes, bags and accessories from ${storeConfig.storeName}, delivered across ${storeConfig.country}.`,
  alternates: { canonical: "/products" },
};

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

const firstValue = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) || "";

async function getInitialCatalog(params: Awaited<SearchParams>): Promise<CatalogInitialData | null> {
  if (!API_BASE) return null;

  const sort = firstValue(params.sort);
  const query = new URLSearchParams({
    page: "1",
    limit: "12",
    category: firstValue(params.category) || "all",
    search: firstValue(params.search),
    sort: !sort || sort === "newest" ? "default" : sort,
  });

  try {
    const [productsResponse, categoriesResponse] = await Promise.all([
      fetch(`${API_BASE}/products?${query.toString()}`, { next: { revalidate: 60 } }),
      fetch(`${API_BASE}/categories`, { next: { revalidate: 300 } }),
    ]);
    if (!productsResponse.ok) return null;

    const productsBody = await productsResponse.json();
    const categoriesBody = categoriesResponse.ok ? await categoriesResponse.json() : [];

    return {
      products: productsBody?.data ?? [],
      totalItems: productsBody?.meta?.totalItems ?? 0,
      totalPages: productsBody?.meta?.totalPages ?? 1,
      categories: Array.isArray(categoriesBody) ? categoriesBody : categoriesBody?.data ?? [],
    };
  } catch {
    // Fall back to loading in the browser if the API is unreachable at render time.
    return null;
  }
}

export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const initialData = await getInitialCatalog(await searchParams);

  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center py-12">
          <HugeiconsIcon icon={Loading03Icon} size={36} className="animate-spin text-gray-500" />
        </main>
      }
    >
      <ProductCatalog initialData={initialData} />
    </Suspense>
  );
}
