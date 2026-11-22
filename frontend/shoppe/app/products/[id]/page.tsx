import type { Metadata } from "next";
import { notFound } from "next/navigation";
import  ProductDetailClient  from "./product-detail-client";
import { getAssetUrl } from "@/lib/api";
import { storeConfig } from "@/lib/store-config";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

type Category = {
  id: string;
  name: string;
  slug: string;
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
  images?: ProductGalleryImage[];
};

type ProductGalleryImage = {
  id: string;
  url: string;
  isPrimary: boolean;
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === "development"
    ? "http://localhost:5000/api/v1"
    : "");

async function getProduct(productId: string): Promise<Product | null> {
  if (!API_BASE) return null;

  try {
    const response = await fetch(`${API_BASE}/products/${productId}`, {
      next: {
        revalidate: 60,
      },
    });

    if (!response.ok) return null;

    return response.json();
  } catch {
    return null;
  }
}

function getProductDescription(product: Product) {
  return (
    product.description ||
    `${product.name} is available from ${storeConfig.storeName}. View price, availability, and checkout securely online.`
  );
}

function getPreferredProductImage(product: Product) {
  return (
    product.images?.find((image) => image.isPrimary)?.url ||
    product.images?.[0]?.url ||
    product.image
  );
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    return {
      title: "Product Not Found",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const description = getProductDescription(product);
  const imageUrl = getAssetUrl(getPreferredProductImage(product)) || undefined;
  const productUrl = `${storeConfig.siteUrl}/products/${product.id}`;

  return {
    title: product.name,
    description,
    alternates: {
      canonical: productUrl,
    },
    openGraph: {
      title: product.name,
      description,
      url: productUrl,
      siteName: storeConfig.storeName,
      type: "website",
      images: imageUrl
        ? [
            {
              url: imageUrl,
              alt: product.name,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
}

async function getRelated(product: Product): Promise<Product[]> {
  if (!API_BASE || !product.category?.slug) return [];
  try {
    const query = new URLSearchParams({ page: "1", limit: "5", category: product.category.slug, search: "", sort: "default" });
    const response = await fetch(`${API_BASE}/products?${query.toString()}`, { next: { revalidate: 300 } });
    if (!response.ok) return [];
    const body = await response.json();
    const list: Product[] = Array.isArray(body) ? body : body?.data ?? [];
    return list.filter((item) => item.id !== product.id).slice(0, 4);
  } catch {
    return [];
  }
}

export default async function ProductPage({ params }: PageProps) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  const related = await getRelated(product);

  const imageUrl = getAssetUrl(getPreferredProductImage(product));
  const productUrl = `${storeConfig.siteUrl}/products/${product.id}`;

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: getProductDescription(product),
    image: imageUrl ? [imageUrl] : undefined,
    sku: product.id,
    category: product.category?.name,
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: storeConfig.currency,
      price: String(product.price),
      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          // Escape "<" so product text can never close the script tag early.
          __html: JSON.stringify(productSchema).replace(/</g, "\\u003c"),
        }}
      />
      <ProductDetailClient productId={id} initialProduct={product} related={related} />
    </>
  );
}
