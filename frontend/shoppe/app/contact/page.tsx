import { HugeiconsIcon } from "@hugeicons/react";
import { Call02Icon, Location01Icon, Mail01Icon, WhatsappIcon } from "@hugeicons/core-free-icons";
import { storeConfig } from "@/lib/store-config";

export const metadata = {
  title: "Contact",
  description: `Contact ${storeConfig.storeName}.`,
};

export default function ContactPage() {
  const whatsappDigits = storeConfig.whatsappNumber.replace(/\D/g, "");
  const channels = [
    {
      label: "Email",
      value: storeConfig.supportEmail,
      href: `mailto:${storeConfig.supportEmail}`,
      icon: Mail01Icon,
      bg: "#FF4FA3",
      fg: "#141414",
    },
    ...(whatsappDigits
      ? [
          {
            label: "WhatsApp",
            value: storeConfig.whatsappNumber,
            href: `https://wa.me/${whatsappDigits}`,
            icon: WhatsappIcon,
            bg: "#1FAF6E",
            fg: "#141414",
            external: true,
          },
        ]
      : []),
    {
      label: "Phone",
      value: storeConfig.supportPhone,
      href: `tel:${storeConfig.supportPhone.replace(/\s/g, "")}`,
      icon: Call02Icon,
      bg: "#2F5BFF",
      fg: "#FFFFFF",
    },
  ];

  return (
    <main className="min-h-screen py-12 sm:py-16">
      <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <span className="inline-block rounded-md border-[1.5px] border-ink bg-white px-2.5 py-1.5 font-mono text-xs font-semibold tracking-wide uppercase">
          Support
        </span>
        <h1 className="mt-4 text-6xl leading-none font-extrabold tracking-[-0.045em] text-ink sm:text-7xl">Contact us</h1>
        <p className="mt-4 max-w-xl text-lg text-gray-700">Questions about an order, delivery, returns or payment? Reach us however suits you.</p>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {channels.map((channel) => (
            <a
              key={channel.label}
              href={channel.href}
              {...("external" in channel && channel.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="sticker flex min-h-52 flex-col justify-between gap-6 rounded-lg border-[1.5px] border-ink p-6"
              style={{ background: channel.bg, color: channel.fg }}
            >
              <HugeiconsIcon icon={channel.icon} size={60} strokeWidth={1.4} />
              <span>
                <span className="block font-display text-3xl font-extrabold tracking-[-0.02em]">{channel.label}</span>
                <span className="mt-1 block text-[15px] font-medium break-all">{channel.value}</span>
              </span>
            </a>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-4 rounded-lg border-[1.5px] border-ink bg-sun-soft p-5">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border-[1.5px] border-ink bg-sun">
            <HugeiconsIcon icon={Location01Icon} size={32} strokeWidth={1.5} />
          </span>
          <p className="text-base text-ink">{storeConfig.businessAddress}</p>
        </div>
      </section>
    </main>
  );
}
