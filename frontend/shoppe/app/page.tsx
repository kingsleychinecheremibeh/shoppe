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

const DEAL_LIMIT = 20000;

async function getHomeData() {
  try {
    if (!API_BASE) {
      return { categories: [] as Category[], products: [] as Product[], deals: [] as Product[] };
    }

    const [categoriesResponse, productsResponse, dealsResponse] = await Promise.all([
      fetch(`${API_BASE}/categories`, { next: { revalidate: 60 } }),
      fetch(`${API_BASE}/products`, { next: { revalidate: 60 } }),
      fetch(`${API_BASE}/products?page=1&limit=8&sort=price-asc`, { next: { revalidate: 60 } }),
    ]);

    const categoriesData = categoriesResponse.ok ? await categoriesResponse.json() : [];
    const productsData = productsResponse.ok ? await productsResponse.json() : [];
    const dealsData = dealsResponse.ok ? await dealsResponse.json() : [];
    const list = (data: unknown) => (Array.isArray(data) ? data : (data as { data?: unknown[] })?.data || []) as Product[];

    return {
      categories: list(categoriesData) as unknown as Category[],
      products: list(productsData),
      deals: list(dealsData).filter((product) => Number(product.price) <= DEAL_LIMIT && product.stock > 0),
    };
  } catch {
    return { categories: [] as Category[], products: [] as Product[], deals: [] as Product[] };
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
  const { categories, products, deals } = await getHomeData();
  const inStock = products.filter((product) => product.stock > 0 && productImage(product));
  // Three products from different categories for the hero "sticker pile".
  const pile: Product[] = [];
  for (const product of inStock) {
    if (pile.length === 3) break;
    if (!pile.some((picked) => picked.category?.id === product.category?.id)) pile.push(product);
  }
  for (const product of inStock) {
    if (pile.length === 3) break;
    if (!pile.includes(product)) pile.push(product);
  }
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

        {pile.length > 0 ? (
          <div className="relative min-h-[26rem] sm:min-h-[32rem]" aria-label="Featured products">
            {pile.map((product, index) => {
              const theme = getCategoryTheme(product.category);
              const url = getAssetUrl(productImage(product));
              const layout = [
                "left-[4%] top-[6%] w-[58%] -rotate-6 z-10",
                "right-[2%] top-0 w-[52%] rotate-[5deg] z-20",
                "left-[22%] bottom-0 w-[56%] -rotate-1 z-30",
              ][index];
              return (
                <Link
                  key={product.id}
                  href={`/products/${product.id}`}
                  className={`group absolute aspect-[4/5] rounded-lg border-[1.5px] border-ink bg-white p-2 shadow-sticker transition duration-200 hover:z-40 hover:-translate-y-2 hover:rotate-0 ${layout}`}
                >
                  <span className="relative block h-full w-full overflow-hidden rounded-md" style={{ background: theme.soft }}>
                    {url && (
                      <ProductImage
                        src={url}
                        alt={product.name}
                        fill
                        priority={index === 2}
                        className="object-cover mix-blend-multiply transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 1024px) 60vw, 25vw"
                      />
                    )}
                    <span
                      className="absolute top-2 left-2 inline-flex items-center gap-1.5 rounded-md border-[1.5px] border-ink py-1 pr-2 pl-1.5 text-xs font-semibold"
                      style={{ background: theme.solid, color: theme.onSolid }}
                    >
                      <HugeiconsIcon icon={theme.icon} size={18} strokeWidth={1.7} />
                      {product.category?.name}
                    </span>
                    <span className="absolute right-2 bottom-2 left-2 flex items-end justify-between gap-2 rounded-md bg-ink px-2.5 py-2 text-paper">
                      <span className="truncate text-xs font-medium sm:text-sm">{product.name}</span>
                      <span className="price-tag shrink-0 text-sm sm:text-base">{formatPrice(product.price)}</span>
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
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

      {/* Under ₦20k */}
      {deals.length >= 2 && (
        <section className="border-y-[1.5px] border-ink bg-sun">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="mb-6 flex items-end justify-between gap-4">
              <h2 className="text-4xl font-extrabold text-ink sm:text-5xl">
                Under <span className="font-mono tracking-tight">₦20k</span>
              </h2>
              <Link href="/products?sort=price-asc" className="group inline-flex items-center gap-1.5 text-[15px] font-semibold underline-offset-4 hover:underline">
                Cheapest first
                <HugeiconsIcon icon={ArrowRight02Icon} size={22} strokeWidth={1.8} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-5 lg:grid-cols-4">
              {deals.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

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
