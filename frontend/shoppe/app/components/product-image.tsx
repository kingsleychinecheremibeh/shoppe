import Image from "next/image";

type ProductImageProps = {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  fill?: boolean;
  sizes: string;
};

export function ProductImage({ src, alt, className, width = 500, height = 500, fill = false, sizes }: ProductImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      className={className}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      sizes={sizes}
    />
  );
}
