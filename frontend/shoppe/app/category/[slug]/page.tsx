"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function CategoryRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  useEffect(() => {
    if (slug) {
      router.replace(`/products?category=${slug}`);
    } else {
      router.replace("/products");
    }
  }, [slug, router]);

  return (
    <main className="min-h-screen bg-white flex items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-brand" />
    </main>
  );
}
