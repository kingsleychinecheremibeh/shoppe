import { storeConfig } from "@/lib/store-config";

export const metadata = {
  title: "Privacy Policy",
  description: `Privacy Policy for ${storeConfig.storeName}.`,
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen py-12 sm:py-16">
      <section className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div>
          <p className="inline-block rounded-md border-[1.5px] border-ink bg-white px-2.5 py-1.5 font-mono text-xs font-semibold tracking-wide uppercase">
            Legal
          </p>
          <h1 className="mt-4 text-5xl leading-none font-extrabold tracking-[-0.045em] text-ink sm:text-6xl">
            Privacy Policy
          </h1>

          <div className="mt-10 space-y-4 text-[15px] leading-7 text-gray-700">
            <p>
              {storeConfig.storeName} collects customer information needed to
              process orders, deliver products, provide customer support, and
              improve the shopping experience.
            </p>

            <section className="rounded-lg border-[1.5px] border-ink bg-white p-6">
              <h2 className="text-2xl font-extrabold text-ink">
                Information We Collect
              </h2>
              <p className="mt-2">
                We may collect your name, email address, phone number, delivery
                address, order details, payment status, and support messages.
              </p>
            </section>

            <section className="rounded-lg border-[1.5px] border-ink bg-white p-6">
              <h2 className="text-2xl font-extrabold text-ink">
                Payments
              </h2>
              <p className="mt-2">
                Card and payment details are processed by our payment provider.
                We do not store full card details on this website.
              </p>
            </section>

            <section className="rounded-lg border-[1.5px] border-ink bg-white p-6">
              <h2 className="text-2xl font-extrabold text-ink">
                How We Use Your Information
              </h2>
              <p className="mt-2">
                We use your information to process purchases, arrange delivery,
                send order updates, prevent fraud, respond to support requests,
                and comply with legal obligations.
              </p>
            </section>

            <section className="rounded-lg border-[1.5px] border-ink bg-white p-6">
              <h2 className="text-2xl font-extrabold text-ink">Analytics</h2>
              <p className="mt-2">
                We use Vercel Analytics and Microsoft Clarity to understand how visitors use the store (pages visited,
                clicks, scrolling and device type) so we can improve it. Pages with personal details, such as your
                account, checkout and orders, are masked, and passwords and payment details are never recorded.
              </p>
            </section>

            <section className="rounded-lg border-[1.5px] border-ink bg-white p-6">
              <h2 className="text-2xl font-extrabold text-ink">
                Contact
              </h2>
              <p className="mt-2">
                For privacy requests, contact us at{" "}
                <a className="font-semibold text-ink underline underline-offset-4" href={`mailto:${storeConfig.supportEmail}`}>
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