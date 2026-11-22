"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Loading03Icon } from "@hugeicons/core-free-icons";

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
    <main className="flex min-h-screen items-center justify-center" aria-busy="true">
      <HugeiconsIcon icon={Loading03Icon} size={36} className="animate-spin text-gray-500" />
      <span className="sr-only">Loading category</span>
    </main>
  );
}
