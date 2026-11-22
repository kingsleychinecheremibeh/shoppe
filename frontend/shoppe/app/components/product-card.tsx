import type { ReactNode } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Image01Icon } from "@hugeicons/core-free-icons";
import { ProductImage } from "@/app/components/product-image";
import { getAssetUrl } from "@/lib/api";
import { getCategoryTheme } from "@/lib/category-colors";
import { formatPrice } from "@/lib/format";

export type ProductCardProduct = {
  id: string;
  name: string;
  price: number | string;
  image?: string | null;
  images?: { url: string; isPrimary?: boolean }[];
  stock?: number;
  category?: { name: string; slug?: string } | null;
};

type ProductCardProps = {
  product: ProductCardProduct;
  priority?: boolean;
  /** Optional control (e.g. quick add) shown over the bottom-right corner of the image. */
  action?: ReactNode;
};

const LOW_STOCK = 8;

const getPrimaryImage = (product: ProductCardProduct) =>
  product.images?.find((image) => image.isPrimary)?.url || product.images?.[0]?.url || product.image;

export function ProductCard({ product, priority = false, action }: ProductCardProps) {
  const imageUrl = getAssetUrl(getPrimaryImage(product));
  const stock = typeof product.stock === "number" ? product.stock : undefined;
  const soldOut = stock !== undefined && stock <= 0;
  const lowStock = stock !== undefined && stock > 0 && stock <= LOW_STOCK;
  const theme = getCategoryTheme(product.category);
  const href = `/products/${product.id}`;

  return (
    <div className="group flex flex-col gap-3">
      <div
        className="sticker-target relative aspect-4/5 overflow-hidden rounded-lg border-[1.5px] border-ink"
        style={{ background: theme.soft }}
      >
        <Link href={href} className="relative block h-full w-full" tabIndex={-1} aria-hidden="true">
          {imageUrl ? (
            <ProductImage
              src={imageUrl}
              alt=""
              fill
              className={`object-cover mix-blend-multiply transition-transform duration-500 ease-out group-hover:scale-[1.03] ${soldOut ? "opacity-50 grayscale" : ""}`}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              priority={priority}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-gray-500">
              <HugeiconsIcon icon={Image01Icon} size={40} strokeWidth={1.4} />
            </div>
          )}
        </Link>

        {soldOut && (
          <span className="pointer-events-none absolute left-3 top-3 rounded-md border-[1.5px] border-ink bg-white px-2 py-1 font-mono text-[11px] font-semibold uppercase">
            Sold out
          </span>
        )}
        {lowStock && (
          <span className="pointer-events-none absolute left-3 top-3 rounded-md border-[1.5px] border-ink bg-sun px-2 py-1 font-mono text-[11px] font-semibold uppercase">
            Only {stock} left
          </span>
        )}

        <span className="price-tag pointer-events-none absolute bottom-3 left-3 rounded-md bg-ink px-2.5 py-1.5 text-[15px] text-paper">
          {formatPrice(product.price)}
        </span>

        {action && <div className="absolute bottom-3 right-3">{action}</div>}
      </div>

      <Link href={href} className="block space-y-1.5">
        <h3 className="line-clamp-2 text-base leading-snug font-semibold text-ink underline-offset-4 group-hover:underline">
          {product.name}
        </h3>
        {product.category?.name && (
          <p className="flex items-center gap-1.5 text-sm text-gray-600">
            <span className="h-2.5 w-2.5 rounded-[3px] border border-ink" style={{ background: theme.solid }} aria-hidden="true" />
            {product.category.name}
          </p>
        )}
      </Link>
    </div>
  );
}
