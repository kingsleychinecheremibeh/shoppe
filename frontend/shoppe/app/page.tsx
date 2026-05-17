"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import Image from "next/image";

type Category = {
  id: number;
  name: string;
  slug: string;
};

type Product = {
  id: number;
  name: string;
  slug: string;
  description?: string;
  price: number | string;
  image?: string | null;
  stock?: number;
  category?: Category;
};

function ProductCard({ product }: { product: Product }) {
  return (
    <Link 
      href={`/products/${product.id}`}
      className="group block overflow-hidden rounded-lg border border-gray-200 bg-white"
    >
      <div className="aspect-square overflow-hidden bg-gray-100">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            width={500}
            height={500}
            priority
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-small text-gray-500">
            No image
          </div>  
      )}
      </div>

      <div className="p-4">
        <p className="mb-1 text-sm text-gray-500">{product.category?.name || "Product"}</p>
        <h3 className="line-clamp-1 font-semibold text-gray-950">{product.name}</h3>
        <p className="mt-2 font-bold text-gray-900">${typeof product.price === "number" ? product.price.toFixed(2) : product.price}</p>
      </div>
    </Link> 
  );
}

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getCategories(), api.getProducts()])
      .then(([categoriesData, productData]) => {
        setCategories((categoriesData as Category[]) || []);
        setProducts((productData as Product[]) || []);
      })
      .catch((error) => {
        console.error("Failed to fetch home page data:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []); // Empty dependency array to run only once on mount

  const newArrivals = products.slice(0, 4);
  const featuredProducts = products.slice(4, 8).length ? products.slice(4, 8) : products.slice(0, 4);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-black" /> 
      </div>
    );
  }

  return (
    <main>
      <section className="bg-gray-950 text-white">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h1 className="mb-6 text-5xl font-bold md:text-6xl">
              Shoppe Collection
            </h1>
            <p className="mb-8 text-xl text-gray-300">
              Discover our exclusive collection of products, carefully curated to meet your needs. From the latest trends to timeless classics, we have something for everyone. Shop now and experience the best in quality and style.
            </p>
            <Link
              href="/products"
              className="inline-flex rounded-lg bg-white px-8 py-3 font-medium text-black transition-colors hover:bg-gray-100"
            >
              Shop Now
            </Link>  
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="mb-8 text-3xl font-bold">Shop by Category</h2>
        {categories.length ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {categories.slice(0, 3).map((category) => (
              <Link
                key={category.id}
                href={`/category/${category.slug}`}
                className="group flex aspect-4/3 items-center justify-center rounded-lg text-center transition-colors hover:bg-gray-200"
              >
                <h3 className="text-2xl font-bold text-gray-950">{category.name}</h3>
              </Link>  
            ))}
          </div>
        ) : (
          <p className="text-gray-600">No categories found.</p>
        )}
      </section>

      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between gap-4">
            <h2 className="text-3xl font-bold">New Arrivals</h2>
            <Link href="/products" className="text-sm font-medium hover:underline">
              View All
            </Link>
          </div>

          {newArrivals.length ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {newArrivals.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No Products available yet.</p>
          )}
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between gap-4">
            <h2 className="text-3xl font-bold">Featured Products</h2>
            <Link href="/products" className="text-sm font-medium hover:underline">
              View All
            </Link>
          </div>

          {featuredProducts.length ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No featured products available.</p>
          )}
        </div>
      </section>

      <section className="bg-black py-16 text-white">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-4 text-3xl font-bold">Join Our Newsletter</h2>
          <p className="mb-8 text-gray-300">
            Get updates on new arrivals, offers, and product drops.
          </p>
          <form className="mx-auto flex max-w-md gap-3">
            <input
              type="email"
              placeholder="Enter your email"
              className="min-w-0 flex-1 rounded-lg px-4 py-3 text-black outline-none"
            />
            <button
              type="submit"
              className="rounded-lg bg-white px-6 py-3 font-medium text-black transition-colors hover:bg-gray-100"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

