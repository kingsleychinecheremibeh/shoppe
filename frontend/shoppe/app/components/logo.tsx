/**
 * Shoppe "Bag stack" logo. Paths match brand/logo/shoppe-mark.svg (the "s" is outlined
 * Bricolage Grotesque ExtraBold), so it renders identically without the font.
 */

const S_PATH =
  "M42.31 83.5Q38.79 83.5 35.76 82.8Q32.73 82.1 30.5 80.57Q28.27 79.04 27.11 76.48Q25.94 73.92 26.14 70.26L35.53 69.46Q35.66 71.65 36.52 73.09Q37.39 74.52 38.92 75.18Q40.45 75.85 42.65 75.85Q44.71 75.85 46.21 75.15Q47.7 74.45 47.7 72.79Q47.7 71.92 47.17 71.36Q46.64 70.79 45.21 70.29Q43.78 69.79 41.05 69.13Q37.66 68.26 34.93 67.4Q32.2 66.53 30.27 65.33Q28.34 64.13 27.34 62.37Q26.34 60.61 26.34 58.01Q26.34 54.35 28.31 51.79Q30.27 49.23 33.73 47.86Q37.19 46.5 41.72 46.5Q45.77 46.5 49.3 47.76Q52.83 49.03 54.86 51.89Q56.89 54.75 56.36 59.48L47.17 60.34Q47.37 58.41 46.64 57.05Q45.91 55.68 44.51 54.98Q43.11 54.29 41.12 54.29Q38.85 54.29 37.62 55.12Q36.39 55.95 36.39 57.21Q36.39 58.21 37.16 58.91Q37.92 59.61 39.55 60.11Q41.18 60.61 43.78 61.21Q46.04 61.67 48.5 62.4Q50.97 63.14 53.09 64.37Q55.22 65.6 56.56 67.6Q57.89 69.59 57.89 72.65Q57.89 75.91 56.09 78.38Q54.29 80.84 50.83 82.17Q47.37 83.5 42.31 83.5Z";

type LogoMarkProps = {
  size?: number;
  /** Outline colour: ink on light backgrounds, paper on dark. */
  tone?: "light" | "dark";
  className?: string;
};

export function LogoMark({ size = 44, tone = "light", className }: LogoMarkProps) {
  const stroke = tone === "dark" ? "#FAF7F0" : "#141414";
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} className={className} aria-hidden="true">
      <rect x="24" y="46" width="72" height="72" rx="10" fill="#2F5BFF" stroke={stroke} strokeWidth="5" />
      <rect x="15" y="37" width="72" height="72" rx="10" fill="#FF4FA3" stroke={stroke} strokeWidth="5" />
      <path
        d="M30 31V22C30 15.373 35.373 10 42 10C48.627 10 54 15.373 54 22V31"
        fill="none"
        stroke={stroke}
        strokeWidth="7"
        strokeLinecap="round"
      />
      <rect x="6" y="28" width="72" height="72" rx="10" fill="#FFC400" stroke={stroke} strokeWidth="5" />
      <path d={S_PATH} fill="#141414" />
    </svg>
  );
}

type LogoProps = LogoMarkProps & { wordmarkClassName?: string };

/** Mark + "shoppe" wordmark. The wordmark uses the display font (Bricolage Grotesque 800). */
export function Logo({ size = 44, tone = "light", className, wordmarkClassName }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className || ""}`}>
      <LogoMark size={size} tone={tone} />
      <span
        className={`font-display text-[1.75rem] leading-none font-extrabold tracking-[-0.035em] ${
          tone === "dark" ? "text-sun" : "text-ink"
        } ${wordmarkClassName || ""}`}
      >
        shoppe
      </span>
    </span>
  );
}
