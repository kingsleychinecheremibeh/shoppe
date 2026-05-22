import { ArrowRight, ArrowUpRight, ShieldCheck, Truck, RefreshCw } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { ProductImage } from "@/app/components/product-image";
import { getAssetUrl } from "@/lib/api";

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

// // Curated high-fashion lookbook images to dynamically assign based on Category Slug
// const categoryImages: Record<string, string> = {
//   apparel: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80",
//   clothing: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80",
//   accessories: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80",
//   bags: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80",
//   footwear: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80",
//   shoes: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80",
//   home: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80",
// };

// const getCategoryImage = (category: Category) => {
//   if (category.image) return category.image;
//   const slug = category.slug?.toLowerCase();
//   return categoryImages[slug] || "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&q=80";
// };

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "NGN",
});

const DEFAULT_API_BASE = process.env.VERCEL
  ? "https://shoppe-backend-yko6.onrender.com/api/v1"
  : "http://localhost:5000/api/v1";
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_BASE;

async function getHomeData() {
  try {
    const [categoriesResponse, productsResponse] = await Promise.all([
      fetch(`${API_BASE}/categories`, { cache: "no-store" }),
      fetch(`${API_BASE}/products`, { cache: "no-store" }),
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

function ProductCard({ product }: { product: Product }) {
  const imageUrl = getAssetUrl(product.image);
  return (
    <Link 
      href={`/products/${product.id}`}
      className="group block overflow-hidden transition"
    >
      <div className="aspect-square overflow-hidden bg-gray-50 border border-gray-100 rounded-lg relative">
        {imageUrl ? (
          <ProductImage
            src={imageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-103"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-gray-400">
            No image
          </div>  
        )}
        <div className="absolute inset-0 bg-black/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex items-end p-4">
          <span className="bg-white text-gray-950 text-xs font-bold uppercase tracking-wider py-2 px-3 rounded shadow-sm inline-flex items-center gap-1.5 translate-y-2 opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100">
            Quick View
            <ArrowUpRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>

      <div className="mt-4 flex justify-between items-start">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
            {product.category?.name || "Premium Collection"}
          </span>
          <h3 className="mt-0.5 text-sm font-bold text-gray-950 group-hover:underline line-clamp-1">{product.name}</h3>
        </div>
        <p className="text-sm font-black text-gray-900 shrink-0 ml-4">
          {currencyFormatter.format(Number(product.price))}
        </p>
      </div>
    </Link> 
  );
}

function CategoryCard({ category }: { category: Category }) {
  const imageUrl = getAssetUrl(category.image);
  return (
    <Link
      href={`/category/${category.slug}`}
      className="group relative aspect-3/4 overflow-hidden rounded-xl bg-gray-100 block shadow-xs transition hover:shadow-md"
    >
      <div className="h-full w-full">
        {imageUrl ? (
          <ProductImage
            src={imageUrl}
            alt={category.name}
            className="h-full w-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full">
            No image available
          </div>
        )}
      </div>
      <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent flex flex-col justify-end p-6">
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-300 mb-1">Explore Range</span>
        <h3 className="text-xl font-bold text-white tracking-wider uppercase font-serif md:text-2xl">{category.name}</h3>
      </div>
    </Link>  
  );
}

export default async function Home() {
  const { categories, products } = await getHomeData();
  const newArrivals = products.slice(0, 4);
  const featuredProducts = products.slice(4, 8).length ? products.slice(4, 8) : products.slice(0, 4);

  return (
    <main className="bg-white">
      
      {/* Editorial Split Hero Section */}
      <section className="relative bg-gray-50 border-b border-gray-200 py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-7 max-w-xl">
              <span className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 block">Spring / Summer Edition</span>
              <h1 className="mb-6 text-5xl font-black md:text-7xl leading-tight font-serif text-gray-950">
                The Art of <br className="hidden md:inline" /> Essentials
              </h1>
              <p className="mb-8 text-base md:text-lg text-gray-600 leading-relaxed font-sans">
                Carefully curated items sourced from designers worldwide. Sourced globally, curated locally. Premium clothing, objects, and functional utilities designed to elevate the quiet details of everyday life.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/products"
                  className="inline-flex items-center gap-2 bg-gray-950 text-white px-8 py-3.5 rounded-lg text-sm font-semibold hover:bg-gray-800 transition shadow-sm"
                >
                  Explore Collection
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/products?category=apparel"
                  className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-8 py-3.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-gray-950 transition"
                >
                  View Lookbook
                </Link>
              </div>
            </div>

            {/* Right Side Image Composition */}
            <div className="lg:col-span-5 w-full mt-10 lg:mt-0">
              <div className="relative aspect-4/5 w-full rounded-2xl bg-gray-100 border border-gray-200 shadow-sm p-4">
                <Image
                  src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80"
                  alt="Editorial lookbook showcase"
                  className="h-full w-full object-cover rounded-xl"
                  width={600}
                  height={800}
                  priority
                  sizes="(max-width: 1024px) 100vw, 42vw"
                />
                <div className="absolute bottom-8 left-6 lg:-left-8 bg-white p-5 rounded-xl border border-gray-100 shadow-lg max-w-50">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Featured Capsule</p>
                  <p className="font-serif font-bold text-gray-950 mt-1 leading-snug">Minimalist Wardrobe Series</p>
                  <Link href="/products" className="text-xs font-bold text-gray-900 hover:underline mt-2 inline-flex items-center gap-1">
                    Shop capsule <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Editorial Value Props Banner */}
      <section className="border-b border-gray-100 py-8 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-3.5">
            <Truck className="h-5 w-5 text-gray-400 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Free Standard Shipping</h4>
              <p className="text-[11px] text-gray-500 mt-0.5">Complimentary shipping on all orders over $150</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3.5 border-y sm:border-y-0 sm:border-x border-gray-100 py-4 sm:py-0 sm:px-6">
            <ShieldCheck className="h-5 w-5 text-gray-400 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Warranty Guarantee</h4>
              <p className="text-[11px] text-gray-500 mt-0.5">Physical quality audits before packaging</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3.5">
            <RefreshCw className="h-5 w-5 text-gray-400 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Easy Returns</h4>
              <p className="text-[11px] text-gray-500 mt-0.5">Worry-free 30-day return policy</p>
            </div>
          </div>
        </div>
      </section>

      {/* Category Section */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 bg-white">
        <div className="text-center max-w-md mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-gray-400 block mb-2">Curated Ranges</span>
          <h2 className="text-3xl font-bold font-serif text-gray-950">Shop by Category</h2>
        </div>
        
        {categories.length ? (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3 max-w-5xl mx-auto">
            {categories.slice(0, 3).map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center">No categories registered.</p>
        )}
      </section>

      {/* New Arrivals Section */}
      <section className="bg-gray-50/50 border-y border-gray-100 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-gray-400 block mb-2">Just Released</span>
              <h2 className="text-3xl font-bold font-serif text-gray-950">New Arrivals</h2>
            </div>
            <Link href="/products" className="text-xs font-bold uppercase tracking-wider border-b border-gray-950 pb-0.5 hover:opacity-75 transition shrink-0 self-start sm:self-auto mt-4 sm:mt-0">
              View All Products
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {newArrivals.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Editorial lookbook Promo Split section */}
      <section className="grid grid-cols-1 lg:grid-cols-2 overflow-hidden bg-gray-950 text-white">
        
        {/* Lookbook Image Container */}
        <div className="aspect-video lg:aspect-auto min-h-87.5 relative">
          <Image
            src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=80"
            alt="Summer collection lifestyle shoot"
            className="h-full w-full object-cover"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        </div>

        {/* Lookbook Promo Copy */}
        <div className="flex flex-col justify-center p-8 sm:p-16 md:p-24 max-w-2xl">
          <span className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 block">Summer Lookbook</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-serif leading-tight mb-5">
            Structured Shapes & Minimal Textures
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed mb-8">
            An exploration of form, tone, and organic breathability. Tailored for comfort in warm climates, featuring premium European linens, structured organic cottons, and functional details engineered to last a lifetime.
          </p>
          <Link
            href="/products?category=apparel"
            className="self-start inline-flex items-center gap-2 border border-white/30 rounded-lg px-6 py-3 text-xs font-bold uppercase tracking-wider hover:bg-white hover:text-gray-950 transition"
          >
            Explore Lookbook
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

      </section>

      {/* Featured Products Section */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-gray-400 block mb-2">Our Curation</span>
              <h2 className="text-3xl font-bold font-serif text-gray-950">Curated Classics</h2>
            </div>
            <Link href="/products" className="text-xs font-bold uppercase tracking-wider border-b border-gray-950 pb-0.5 hover:opacity-75 transition shrink-0 self-start sm:self-auto mt-4 sm:mt-0">
              View Collection
            </Link>
          </div>

          {featuredProducts.length ? (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center">No curated classics available.</p>
          )}
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="bg-gray-50 border-t border-gray-200 py-24 text-center">
        <div className="mx-auto max-w-xl px-4 sm:px-6 lg:px-8">
          <span className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 block">Weekly Editorial</span>
          <h2 className="mb-4 text-3xl font-bold font-serif text-gray-950">Join the Editorial</h2>
          <p className="mb-8 text-sm text-gray-600 leading-relaxed max-w-md mx-auto">
            Subscribe to receive priority notifications on curated product drops, private lookbooks, and periodic design narratives.
          </p>
          <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              id="editorialEmail"
              name="editorialEmail"
              type="email"
              placeholder="Enter your email"
              className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-950 placeholder-gray-400 focus:border-gray-950 focus:outline-none focus:ring-1 focus:ring-gray-950"
              required
            />
            <button
              type="button"
              className="rounded-lg bg-gray-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>

    </main>
  );
}
