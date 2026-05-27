import { CreditCard, Mail, RefreshCw, ShieldCheck } from "lucide-react";
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
    icon: CreditCard,
  },
  {
    title: "Card Details",
    description:
      "This website does not store full card information. Sensitive payment details are handled by the payment provider.",
    icon: ShieldCheck,
  },
  {
    title: "Order Confirmation",
    description:
      "After payment, customers are redirected back to the store and the order status is updated through the checkout flow.",
    icon: RefreshCw,
  },
  {
    title: "Checkout Support",
    description:
      "If payment succeeds but an order does not update, contact support with your order reference or payment reference.",
    icon: Mail,
  },
];

export default function SecureCheckoutPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-gray-200 bg-white p-6 sm:p-10">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-600">
            Customer Protection
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-950">
            Secure Checkout
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-gray-600">
            {storeConfig.storeName} uses a payment provider to process checkout
            payments. We collect only the order, delivery, and contact details
            needed to complete your purchase and provide support.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {checkoutDetails.map((detail) => {
              const Icon = detail.icon;

              return (
                <section
                  key={detail.title}
                  className="rounded-lg border border-gray-200 p-5"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-950 text-white">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h2 className="text-sm font-bold text-gray-950">
                      {detail.title}
                    </h2>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-gray-600">
                    {detail.description}
                  </p>
                </section>
              );
            })}
          </div>

          <div className="mt-8 rounded-lg bg-gray-50 p-5 text-sm leading-7 text-gray-600">
            <p className="font-bold text-gray-950">Need help with checkout?</p>
            <p className="mt-1">
              Email{" "}
              <a
                href={`mailto:${storeConfig.supportEmail}`}
                className="font-semibold text-gray-950 underline"
              >
                {storeConfig.supportEmail}
              </a>{" "}
              or call {storeConfig.supportPhone}.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
