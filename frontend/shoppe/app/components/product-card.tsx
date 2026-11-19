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
  stock?: number;
  category?: { name: string } | null;
};

type ProductCardProps = {
  product: ProductCardProduct;
  priority?: boolean;
};

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const imageUrl = getAssetUrl(product.image);
  const soldOut = typeof product.stock === "number" && product.stock <= 0;

  return (
    <Link href={`/products/${product.id}`} className="group block">
      <div className="relative aspect-4/5 overflow-hidden rounded-2xl bg-canvas">
        {imageUrl ? (
          <ProductImage
            src={imageUrl}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            priority={priority}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-400">
            <ImageIcon className="h-6 w-6" aria-hidden="true" />
            <span className="sr-only">No image</span>
          </div>
        )}
        {soldOut && (
          <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-medium text-gray-700 shadow-sm">
            Sold out
          </span>
        )}
      </div>

      <div className="mt-3 space-y-0.5">
        <h3 className="line-clamp-1 text-sm font-medium text-gray-900">{product.name}</h3>
        {product.category?.name && (
          <p className="text-xs text-gray-500">{product.category.name}</p>
        )}
        <p className="pt-1 text-sm font-semibold text-gray-950">{formatPrice(product.price)}</p>
      </div>
    </Link>
  );
}
