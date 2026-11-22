import { storeConfig } from "@/lib/store-config";

export const metadata = {
  title: "Terms and Conditions",
  description: `Terms and Conditions for ${storeConfig.storeName}.`,
};

export default function TermsPage() {
  return (
    <main className="min-h-screen py-12 sm:py-16">
      <section className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div>
          <p className="inline-block rounded-md border-[1.5px] border-ink bg-white px-2.5 py-1.5 font-mono text-xs font-semibold tracking-wide uppercase">
            Legal
          </p>
          <h1 className="mt-4 text-5xl leading-none font-extrabold tracking-[-0.045em] text-ink sm:text-6xl">
            Terms and Conditions
          </h1>

          <div className="mt-10 space-y-4 text-[15px] leading-7 text-gray-700">
            <p>
              By using {storeConfig.storeName}, you agree to these terms. Please
              read them before placing an order.
            </p>

            <section className="rounded-lg border-[1.5px] border-ink bg-white p-6">
              <h2 className="text-2xl font-extrabold text-ink">Orders</h2>
              <p className="mt-2">
                Orders are subject to product availability, payment confirmation,
                and delivery coverage. We may cancel or reject orders where
                payment fails, stock is unavailable, or order details appear
                incorrect.
              </p>
            </section>

            <section className="rounded-lg border-[1.5px] border-ink bg-white p-6">
              <h2 className="text-2xl font-extrabold text-ink">Pricing</h2>
              <p className="mt-2">
                Prices may change without notice. If a pricing error occurs, we
                may contact you to confirm or cancel the affected order.
              </p>
            </section>

            <section className="rounded-lg border-[1.5px] border-ink bg-white p-6">
              <h2 className="text-2xl font-extrabold text-ink">Accounts</h2>
              <p className="mt-2">
                Customers are responsible for keeping login details secure and
                providing accurate delivery information.
              </p>
            </section>

            <section className="rounded-lg border-[1.5px] border-ink bg-white p-6">
              <h2 className="text-2xl font-extrabold text-ink">Contact</h2>
              <p className="mt-2">
                For questions, contact{" "}
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