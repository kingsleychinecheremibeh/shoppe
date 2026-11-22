import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight02Icon,
  CreditCardIcon,
  DeliveryTruck01Icon,
  MessageMultiple01Icon,
  RefreshIcon,
} from "@hugeicons/core-free-icons";
import { ProductImage } from "@/app/components/product-image";
import { ProductCard } from "@/app/components/product-card";
import { LogoMark } from "@/app/components/logo";
import { getAssetUrl } from "@/lib/api";
import { getCategoryTheme } from "@/lib/category-colors";
import { formatPrice } from "@/lib/format";
import { storeConfig } from "@/lib/store-config";

type Category = {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
  activeProductCount?: number;
};

type Product = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number | string;
  image?: string | null;
  images?: { url: string; isPrimary?: boolean }[];
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

    const categoriesData = categoriesResponse.ok ? await categoriesResponse.json() : [];
    const productsData = productsResponse.ok ? await productsResponse.json() : [];

    return {
      categories: (Array.isArray(categoriesData) ? categoriesData : categoriesData?.data || []) as Category[],
      products: (Array.isArray(productsData) ? productsData : productsData?.data || []) as Product[],
    };
  } catch {
    return { categories: [] as Category[], products: [] as Product[] };
  }
}

const productImage = (product: Product) =>
  product.images?.find((image) => image.isPrimary)?.url || product.images?.[0]?.url || product.image;

function SectionHeader({ title, href, linkLabel }: { title: string; href: string; linkLabel: string }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <h2 className="text-4xl font-extrabold text-ink sm:text-5xl">{title}</h2>
      <Link
        href={href}
        className="group inline-flex shrink-0 items-center gap-1.5 text-[15px] font-semibold text-ink underline-offset-4 hover:underline"
      >
        {linkLabel}
        <HugeiconsIcon icon={ArrowRight02Icon} size={22} strokeWidth={1.8} className="transition-transform group-hover:translate-x-0.5" />
      </Link>
    </div>
  );
}

const promises = [
  {
    icon: DeliveryTruck01Icon,
    title: "Delivery across Nigeria",
    body: `Arrives in ${storeConfig.deliveryTime}`,
    color: "bg-sun",
  },
  {
    icon: CreditCardIcon,
    title: "Pay your way",
    body: "Card, bank transfer or USSD via Paystack",
    color: "bg-pink",
  },
  {
    icon: RefreshIcon,
    title: "Easy returns",
    body: `${storeConfig.returnWindowDays}-day return window`,
    color: "bg-leaf",
  },
];

export default async function Home() {
  const { categories, products } = await getHomeData();
  const inStock = products.filter((product) => product.stock > 0);
  const hero = inStock.find((product) => productImage(product)) || products.find((product) => productImage(product));
  const heroTheme = getCategoryTheme(hero?.category);
  const heroImage = hero ? getAssetUrl(productImage(hero)) : null;
  const newArrivals = products.slice(0, 4);
  const featuredProducts = products.slice(4, 8).length ? products.slice(4, 8) : products.slice(0, 4);

  return (
    <main>
      {/* Hero */}
      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 pt-10 pb-12 sm:px-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-12 lg:px-8 lg:pt-16">
        <div className="flex flex-col justify-between gap-10">
          <div className="space-y-6">
            <span className="inline-block rounded-md border-[1.5px] border-ink bg-white px-2.5 py-1.5 font-mono text-xs font-semibold tracking-wide uppercase">
              New in this week
            </span>
            <h1 className="text-6xl leading-[0.92] font-extrabold tracking-[-0.045em] text-ink sm:text-7xl xl:text-[6.5rem]">
              Fresh drops,
              <br />
              fair prices.
            </h1>
            <p className="max-w-lg text-lg leading-relaxed text-gray-700 sm:text-xl">
              Tech, fashion, beauty and home picks, delivered across {storeConfig.country} in {storeConfig.deliveryTime}.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/products?sort=newest"
              className="inline-flex h-14 items-center gap-3 rounded-lg bg-ink px-7 text-base font-semibold text-paper transition hover:bg-black"
            >
              Shop new in
              <HugeiconsIcon icon={ArrowRight02Icon} size={26} strokeWidth={1.8} />
            </Link>
            <Link
              href="/categories"
              className="inline-flex h-14 items-center rounded-lg border-[1.5px] border-ink px-7 text-base font-semibold text-ink transition hover:bg-ink hover:text-paper"
            >
              Browse categories
            </Link>
          </div>
        </div>

        {hero && heroImage ? (
          <Link
            href={`/products/${hero.id}`}
            className="sticker group relative block min-h-96 overflow-hidden rounded-lg border-[1.5px] border-ink lg:min-h-[32rem]"
            style={{ background: heroTheme.soft }}
          >
            <ProductImage
              src={heroImage}
              alt={hero.name}
              fill
              priority
              className="object-cover mix-blend-multiply transition-transform duration-700 group-hover:scale-[1.03]"
              sizes="(max-width: 1024px) 100vw, 45vw"
            />
            {hero.category && (
              <span
                className="absolute top-4 left-4 inline-flex items-center gap-2 rounded-lg border-[1.5px] border-ink py-1.5 pr-3 pl-2 text-sm font-semibold"
                style={{ background: heroTheme.solid, color: heroTheme.onSolid }}
              >
                <HugeiconsIcon icon={heroTheme.icon} size={24} strokeWidth={1.6} />
                {hero.category.name}
              </span>
            )}
            <span className="absolute right-4 bottom-4 flex flex-col gap-0.5 rounded-lg bg-ink px-4 py-3 text-paper shadow-[5px_5px_0_0_#fff]">
              <span className="text-sm font-medium">{hero.name}</span>
              <span className="price-tag text-2xl">{formatPrice(hero.price)}</span>
            </span>
          </Link>
        ) : (
          <div className="flex min-h-96 items-center justify-center rounded-lg border-[1.5px] border-ink bg-sun lg:min-h-[32rem]">
            <LogoMark size={200} />
          </div>
        )}
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
          <SectionHeader title="Shop by category" href="/categories" linkLabel="All categories" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
            {categories.slice(0, 6).map((category) => {
              const theme = getCategoryTheme(category);
              return (
                <Link
                  key={category.id}
                  href={`/category/${category.slug}`}
                  className="sticker flex min-h-48 flex-col justify-between gap-8 rounded-lg border-[1.5px] border-ink p-5 sm:min-h-56"
                  style={{ background: theme.solid, color: theme.onSolid }}
                >
                  <HugeiconsIcon icon={theme.icon} size={64} strokeWidth={1.3} />
                  <span className="space-y-1">
                    <span className="block font-display text-2xl leading-tight font-bold tracking-[-0.02em]">{category.name}</span>
                    {typeof category.activeProductCount === "number" && (
                      <span className="block font-mono text-xs font-medium">
                        {category.activeProductCount} {category.activeProductCount === 1 ? "product" : "products"}
                      </span>
                    )}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Promises */}
      <section className="border-y-[1.5px] border-ink bg-white">
        <ul className="mx-auto grid max-w-7xl gap-6 px-4 py-7 sm:grid-cols-3 sm:px-6 lg:px-8">
          {promises.map(({ icon, title, body, color }) => (
            <li key={title} className="flex items-center gap-4">
              <span className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border-[1.5px] border-ink ${color} text-ink`}>
                <HugeiconsIcon icon={icon} size={38} strokeWidth={1.5} />
              </span>
              <div>
                <p className="text-base font-semibold text-ink">{title}</p>
                <p className="text-[15px] text-gray-600">{body}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* New in */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <SectionHeader title="New in" href="/products?sort=newest" linkLabel={products.length ? `See all` : "Shop"} />
        {newArrivals.length ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-5 lg:grid-cols-4">
            {newArrivals.map((product, index) => (
              <ProductCard key={product.id} product={product} priority={index < 2} />
            ))}
          </div>
        ) : (
          <p className="rounded-lg border-[1.5px] border-dashed border-ink px-6 py-10 text-center text-base text-gray-700">
            New products are on the way. Check back soon.
          </p>
        )}
      </section>

      {/* Popular */}
      {featuredProducts.length > 0 && products.length > 4 && (
        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <SectionHeader title="Popular right now" href="/products" linkLabel="Shop all" />
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-5 lg:grid-cols-4">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* Support */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-6 rounded-lg border-[1.5px] border-ink bg-pink-soft px-6 py-8 sm:flex-row sm:items-center sm:px-10">
          <div className="flex items-center gap-5">
            <span className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-lg border-[1.5px] border-ink bg-pink sm:flex">
              <HugeiconsIcon icon={MessageMultiple01Icon} size={36} strokeWidth={1.5} />
            </span>
            <div>
              <h2 className="text-3xl font-extrabold text-ink">Questions about an order?</h2>
              <p className="mt-1 text-[15px] text-gray-700">We help with delivery, returns and payments.</p>
            </div>
          </div>
          <Link
            href="/contact"
            className="inline-flex h-12 shrink-0 items-center gap-2 rounded-lg bg-ink px-6 text-[15px] font-semibold text-paper transition hover:bg-black"
          >
            Contact us
            <HugeiconsIcon icon={ArrowRight02Icon} size={22} strokeWidth={1.8} />
          </Link>
        </div>
      </section>
    </main>
  );
}
