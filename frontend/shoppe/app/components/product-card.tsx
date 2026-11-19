import type { ReactNode } from "react";
import Link from "next/link";
import { ImageIcon } from "lucide-react";
import { ProductImage } from "@/app/components/product-image";
import { getAssetUrl } from "@/lib/api";
import { formatPrice } from "@/lib/format";

export type ProductCardProduct = {
  id: string;
  name: string;
  price: number | string;
  image?: string | null;
  images?: { url: string; isPrimary?: boolean }[];
  stock?: number;
  category?: { name: string } | null;
};

type ProductCardProps = {
  product: ProductCardProduct;
  priority?: boolean;
  /** Optional control (e.g. quick add) shown over the bottom-right corner of the image. */
  action?: ReactNode;
};

const getPrimaryImage = (product: ProductCardProduct) =>
  product.images?.find((image) => image.isPrimary)?.url || product.images?.[0]?.url || product.image;

export function ProductCard({ product, priority = false, action }: ProductCardProps) {
  const imageUrl = getAssetUrl(getPrimaryImage(product));
  const soldOut = typeof product.stock === "number" && product.stock <= 0;
  const href = `/products/${product.id}`;

  return (
    <div className="group">
      <div className="relative aspect-4/5 overflow-hidden rounded-2xl bg-canvas">
        <Link href={href} className="block h-full w-full" tabIndex={-1} aria-hidden="true">
          {imageUrl ? (
            <ProductImage
              src={imageUrl}
              alt=""
              fill
              className={`object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] ${soldOut ? "opacity-60" : ""}`}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              priority={priority}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-gray-400">
              <ImageIcon className="h-6 w-6" />
            </div>
          )}
        </Link>
        {soldOut && (
          <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-medium text-gray-700 shadow-sm">
            Sold out
          </span>
        )}
        {action && <div className="absolute bottom-3 right-3">{action}</div>}
      </div>

      <Link href={href} className="mt-3 block space-y-0.5">
        <h3 className="line-clamp-1 text-sm font-medium text-gray-900 group-hover:underline group-hover:underline-offset-4">
          {product.name}
        </h3>
        {product.category?.name && <p className="text-xs text-gray-500">{product.category.name}</p>}
        <p className="pt-1 text-sm font-semibold text-gray-950">{formatPrice(product.price)}</p>
      </Link>
    </div>
  );
}
