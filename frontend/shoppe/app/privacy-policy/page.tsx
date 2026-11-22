import { storeConfig } from "@/lib/store-config";

export const metadata = {
  title: "Privacy Policy",
  description: `Privacy Policy for ${storeConfig.storeName}.`,
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-white py-12 sm:py-16">
      <section className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div>
          <p className="text-sm font-medium text-brand">
            Legal
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-950 sm:text-4xl">
            Privacy Policy
          </h1>

          <div className="mt-8 space-y-6 text-sm leading-7 text-gray-600">
            <p>
              {storeConfig.storeName} collects customer information needed to
              process orders, deliver products, provide customer support, and
              improve the shopping experience.
            </p>

            <section>
              <h2 className="text-base font-semibold text-gray-950">
                Information We Collect
              </h2>
              <p className="mt-2">
                We may collect your name, email address, phone number, delivery
                address, order details, payment status, and support messages.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-gray-950">
                Payments
              </h2>
              <p className="mt-2">
                Card and payment details are processed by our payment provider.
                We do not store full card details on this website.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-gray-950">
                How We Use Your Information
              </h2>
              <p className="mt-2">
                We use your information to process purchases, arrange delivery,
                send order updates, prevent fraud, respond to support requests,
                and comply with legal obligations.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-gray-950">
                Contact
              </h2>
              <p className="mt-2">
                For privacy requests, contact us at{" "}
                <a className="font-semibold text-gray-950 underline" href={`mailto:${storeConfig.supportEmail}`}>
                  {storeConfig.supportEmail}
                </a>
                .
              </p>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}