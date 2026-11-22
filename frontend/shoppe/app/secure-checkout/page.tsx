import { HugeiconsIcon } from "@hugeicons/react";
import { CreditCardIcon, Mail01Icon, RefreshIcon, Shield01Icon } from "@hugeicons/core-free-icons";
import { storeConfig } from "@/lib/store-config";

export const metadata = {
  title: "Secure Checkout",
  description: `Secure checkout information for ${storeConfig.storeName}.`,
};

const checkoutDetails = [
  {
    title: "Payment Processing",
    description:
      "Payments are handled by Paystack. Depending on available options, customers may pay with card, transfer, USSD, or other supported payment methods.",
    icon: CreditCardIcon,
    color: "#FF4FA3",
  },
  {
    title: "Card Details",
    description:
      "This website does not store full card information. Sensitive payment details are handled by the payment provider.",
    icon: Shield01Icon,
    color: "#1FAF6E",
  },
  {
    title: "Order Confirmation",
    description:
      "After payment, customers are redirected back to the store and the order status is updated through the checkout flow.",
    icon: RefreshIcon,
    color: "#FFC400",
  },
  {
    title: "Checkout Support",
    description:
      "If payment succeeds but an order does not update, contact support with your order reference or payment reference.",
    icon: Mail01Icon,
    color: "#7A5CFF",
  },
];

export default function SecureCheckoutPage() {
  return (
    <main className="min-h-screen py-12 sm:py-16">
      <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <span className="inline-block rounded-md border-[1.5px] border-ink bg-white px-2.5 py-1.5 font-mono text-xs font-semibold tracking-wide uppercase">
          Customer protection
        </span>
        <h1 className="mt-4 text-6xl leading-none font-extrabold tracking-[-0.045em] text-ink">Secure checkout</h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-gray-700">
          {storeConfig.storeName} uses a payment provider to process checkout payments. We collect only the order, delivery, and contact
          details needed to complete your purchase and provide support.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {checkoutDetails.map((detail) => (
            <section key={detail.title} className="rounded-lg border-[1.5px] border-ink bg-white p-6">
              <span
                className="flex h-14 w-14 items-center justify-center rounded-lg border-[1.5px] border-ink text-ink"
                style={{ background: detail.color }}
              >
                <HugeiconsIcon icon={detail.icon} size={32} strokeWidth={1.5} />
              </span>
              <h2 className="mt-4 text-2xl font-extrabold text-ink">{detail.title}</h2>
              <p className="mt-2 text-[15px] leading-relaxed text-gray-700">{detail.description}</p>
            </section>
          ))}
        </div>

        <div className="mt-6 rounded-lg border-[1.5px] border-ink bg-sun-soft p-6 text-[15px] leading-relaxed text-ink">
          <p className="text-xl font-extrabold">Need help with checkout?</p>
          <p className="mt-1">
            Email{" "}
            <a href={`mailto:${storeConfig.supportEmail}`} className="font-semibold underline underline-offset-4">
              {storeConfig.supportEmail}
            </a>{" "}
            or call {storeConfig.supportPhone}.
          </p>
        </div>
      </section>
    </main>
  );
}
