import { ArrowRight, ShieldCheck, Truck, RefreshCw, MessageCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { ProductImage } from "@/app/components/product-image";
import { ProductCard } from "@/app/components/product-card";
import { getAssetUrl } from "@/lib/api";
import { storeConfig } from "@/lib/store-config";

type Category = {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
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

const LOCAL_API_BASE = "http://localhost:5000/api/v1";
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === "development" ? LOCAL_API_BASE : "");

async function getHomeData() {
  try {
    if (!API_BASE) {
      return { categories: [] as Category[], products: [] as Product[] };
    }

    const [categoriesResponse, productsResponse] = await Promise.all([
      fetch(`${API_BASE}/categories`, { next: { revalidate: 60 } }),
      fetch(`${API_BASE}/products`, { next: { revalidate: 60 } }),
    ]);

    const categoriesData = categoriesResponse.ok
      ? await categoriesResponse.json()
      : [];
    const productsData = productsResponse.ok ? await productsResponse.json() : [];

    return {
      categories: (Array.isArray(categoriesData)
        ? categoriesData
        : categoriesData?.data || []) as Category[],
      products: (Array.isArray(productsData)
        ? productsData
        : productsData?.data || []) as Product[],
    };
  } catch {
    return { categories: [] as Category[], products: [] as Product[] };
  }
}

function SectionHeader({ title, href, linkLabel }: { title: string; href: string; linkLabel: string }) {
  return (
    <div className="mb-8 flex items-end justify-between gap-4">
      <h2 className="text-2xl font-semibold tracking-tight text-gray-950 sm:text-3xl">{title}</h2>
      <Link
        href={href}
        className="group inline-flex shrink-0 items-center gap-1 text-sm font-medium text-gray-600 transition hover:text-brand"
      >
        {linkLabel}
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
      </Link>
    </div>
  );
}

function CategoryCard({ category, priority = false }: { category: Category; priority?: boolean }) {
  const imageUrl = getAssetUrl(category.image);
  return (
    <Link href={`/category/${category.slug}`} className="group block">
      <div className="relative aspect-4/5 overflow-hidden rounded-2xl bg-canvas">
        {imageUrl ? (
          <ProductImage
            src={imageUrl}
            alt={category.name}
            fill
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
            sizes="(max-width: 640px) 50vw, 25vw"
            priority={priority}
          />
        ) : null}
      </div>
      <div className="mt-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900">{category.name}</h3>
        <ArrowRight
          className="h-4 w-4 text-gray-400 transition group-hover:translate-x-0.5 group-hover:text-brand"
          aria-hidden="true"
        />
      </div>
    </Link>
  );
}

const promises = [
  {
    icon: Truck,
    title: "Nationwide delivery",
    body: `Delivered in ${storeConfig.deliveryTime}`,
  },
  {
    icon: ShieldCheck,
    title: "Secure payment",
    body: "Pay safely with Paystack",
  },
  {
    icon: RefreshCw,
    title: "Easy returns",
    body: `${storeConfig.returnWindowDays}-day return window`,
  },
];

export default async function Home() {
  const { categories, products } = await getHomeData();
  const newArrivals = products.slice(0, 4);
  const featuredProducts = products.slice(4, 8).length ? products.slice(4, 8) : products.slice(0, 4);

  return (
    <main className="bg-white">
      {/* Hero */}
      <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <div className="grid overflow-hidden rounded-3xl bg-canvas lg:grid-cols-2">
          <div className="flex flex-col justify-center px-6 py-14 sm:px-12 lg:py-24">
            <p className="mb-4 text-sm font-medium text-brand">New in store</p>
            <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight text-gray-950 sm:text-5xl lg:text-6xl">
              Everyday essentials, thoughtfully chosen.
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-gray-600">
              Clothing, shoes, bags and accessories, checked before they ship and delivered across{" "}
              {storeConfig.country}.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-medium text-white transition hover:bg-brand-hover"
              >
                Shop now
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="/categories"
                className="inline-flex items-center rounded-full px-5 py-3 text-sm font-medium text-gray-700 transition hover:bg-white hover:text-gray-950"
              >
                Browse categories
              </Link>
            </div>
          </div>

          <div className="relative min-h-80 lg:min-h-136">
            <Image
              src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1000&q=80"
              alt="Model wearing a cream top from the latest collection"
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
        </div>
      </section>

      {/* Promises */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ul className="grid gap-6 border-b border-gray-100 py-10 sm:grid-cols-3">
          {promises.map(({ icon: Icon, title, body }) => (
            <li key={title} className="flex items-center gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-medium text-gray-900">{title}</p>
                <p className="text-sm text-gray-500">{body}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <SectionHeader title="Shop by category" href="/categories" linkLabel="All categories" />
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-4">
            {categories.slice(0, 4).map((category, index) => (
              <CategoryCard key={category.id} category={category} priority={index < 2} />
            ))}
          </div>
        </section>
      )}

      {/* New arrivals */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <SectionHeader title="New arrivals" href="/products" linkLabel="View all" />
        {newArrivals.length ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
            {newArrivals.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">New products are on the way. Check back soon.</p>
        )}
      </section>

      {/* Featured */}
      {featuredProducts.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
          <SectionHeader title="Popular right now" href="/products" linkLabel="Shop all" />
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* Support */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-canvas px-6 py-10 sm:flex-row sm:items-center sm:px-12">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-gray-950">Questions about an order?</h2>
            <p className="mt-1 text-sm text-gray-600">
              We can help with delivery, returns and payments.
            </p>
          </div>
          <Link
            href="/contact"
            className="inline-flex shrink-0 items-center gap-2 rounded-full border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-900 transition hover:border-gray-950"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            Contact us
          </Link>
        </div>
      </section>
    </main>
  );
}
