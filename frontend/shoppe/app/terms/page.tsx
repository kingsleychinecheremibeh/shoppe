import { storeConfig } from "@/lib/store-config";

export const metadata = {
  title: "Terms and Conditions",
  description: `Terms and Conditions for ${storeConfig.storeName}.`,
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <section className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-gray-200 bg-white p-6 sm:p-10">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-600">
            Legal
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-950">
            Terms and Conditions
          </h1>

          <div className="mt-8 space-y-6 text-sm leading-7 text-gray-600">
            <p>
              By using {storeConfig.storeName}, you agree to these terms. Please
              read them before placing an order.
            </p>

            <section>
              <h2 className="text-base font-bold text-gray-950">Orders</h2>
              <p className="mt-2">
                Orders are subject to product availability, payment confirmation,
                and delivery coverage. We may cancel or reject orders where
                payment fails, stock is unavailable, or order details appear
                incorrect.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-950">Pricing</h2>
              <p className="mt-2">
                Prices may change without notice. If a pricing error occurs, we
                may contact you to confirm or cancel the affected order.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-950">Accounts</h2>
              <p className="mt-2">
                Customers are responsible for keeping login details secure and
                providing accurate delivery information.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-950">Contact</h2>
              <p className="mt-2">
                For questions, contact{" "}
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