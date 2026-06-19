"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageIcon } from "lucide-react";

type ProductImageProps = {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  fill?: boolean;
  sizes: string;
  priority?: boolean;
};

export function ProductImage({ src, alt, className, width = 500, height = 500, fill = false, sizes, priority = false }: ProductImageProps) {
  const [failed, setFailed] = useState(false);
  const unoptimized = src.includes("res.cloudinary.com");

  if (failed) {
    return (
      <div
        className={`${className || ""} flex items-center justify-center bg-gray-100 text-gray-500`}
        role="img"
        aria-label={alt}
      >
        <ImageIcon className="h-6 w-6" />
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      className={className}
      priority={priority}
      decoding="async"
      referrerPolicy="no-referrer"
      sizes={sizes}
      unoptimized={unoptimized}
      onError={() => setFailed(true)}
    />
  );
}
