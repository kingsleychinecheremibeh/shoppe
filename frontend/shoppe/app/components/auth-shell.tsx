import type { ReactNode } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { CreditCardIcon, Location01Icon, PackageIcon } from "@hugeicons/core-free-icons";
import { LogoMark } from "@/app/components/logo";

type Accent = "sun" | "pink" | "blue" | "leaf";

const ACCENTS: Record<Accent, { bg: string; fg: string }> = {
  sun: { bg: "#FFC400", fg: "#141414" },
  pink: { bg: "#FF4FA3", fg: "#141414" },
  blue: { bg: "#2F5BFF", fg: "#FFFFFF" },
  leaf: { bg: "#1FAF6E", fg: "#141414" },
};

const perks = [
  { icon: PackageIcon, text: "Track every order from paid to delivered" },
  { icon: Location01Icon, text: "Save addresses for one-tap checkout" },
  { icon: CreditCardIcon, text: "Pay with card, bank transfer or USSD" },
];

/** Shared layout for login, register and password pages: form card + colour panel. */
export function AuthShell({
  title,
  subtitle,
  accent = "sun",
  children,
  footer,
}: {
  title: string;
  subtitle?: ReactNode;
  accent?: Accent;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const colors = ACCENTS[accent];
  return (
    <main className="mx-auto grid max-w-6xl grid-cols-1 items-stretch gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:gap-12 lg:px-8 lg:py-16">
      <div className="flex flex-col justify-center">
        <div className="mx-auto w-full max-w-md">
          <h1 className="text-5xl leading-none font-extrabold tracking-[-0.045em] text-ink sm:text-6xl">{title}</h1>
          {subtitle && <p className="mt-3 text-base text-gray-700">{subtitle}</p>}
          <div className="mt-8 rounded-lg border-[1.5px] border-ink bg-white p-6 shadow-sticker sm:p-7">{children}</div>
          {footer && <div className="mt-6 text-center text-[15px] text-gray-700">{footer}</div>}
        </div>
      </div>

      <aside
        className="relative hidden overflow-hidden rounded-lg border-[1.5px] border-ink p-10 lg:flex lg:flex-col lg:justify-between"
        style={{ background: colors.bg, color: colors.fg }}
        aria-hidden="true"
      >
        <LogoMark size={120} />
        <ul className="space-y-4">
          {perks.map(({ icon, text }) => (
            <li key={text} className="flex items-center gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border-[1.5px] border-ink bg-white text-ink">
                <HugeiconsIcon icon={icon} size={32} strokeWidth={1.5} />
              </span>
              <span className="font-display text-2xl leading-tight font-bold tracking-[-0.02em]">{text}</span>
            </li>
          ))}
        </ul>
      </aside>
    </main>
  );
}
