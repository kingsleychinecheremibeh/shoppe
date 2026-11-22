import type { CSSProperties } from "react";

/** Building blocks for page loading placeholders (Market Day style). */
export function Bone({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return <div className={`animate-pulse rounded-md bg-canvas ${className}`} style={style} aria-hidden="true" />;
}

export function Card({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return <div className={`animate-pulse rounded-lg border-[1.5px] border-gray-300 ${className}`} style={style} aria-hidden="true" />;
}

export const TINTS = ["#E3E9FF", "#FFE0EF", "#FFF1C2", "#D6F3E5", "#FFE1DA", "#E6E0FF"];
export const SOLIDS = ["#2F5BFF", "#FF4FA3", "#FFC400", "#1FAF6E", "#FF6B4A", "#7A5CFF"];

export function LoadingPage({ label, children, width = "max-w-7xl" }: { label: string; children: React.ReactNode; width?: string }) {
  return (
    <main className="min-h-screen" aria-busy="true">
      <span className="sr-only">{label}</span>
      <div className={`mx-auto ${width} px-4 py-10 sm:px-6 lg:px-8`}>{children}</div>
    </main>
  );
}
