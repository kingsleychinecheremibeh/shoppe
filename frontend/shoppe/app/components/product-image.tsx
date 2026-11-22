"use client";

import { useState } from "react";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import { Image01Icon } from "@hugeicons/core-free-icons";

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
        className={`${className || ""} flex items-center justify-center bg-canvas text-gray-500`}
        role="img"
        aria-label={alt}
      >
        <HugeiconsIcon icon={Image01Icon} size={36} strokeWidth={1.4} />
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
