import { storeConfig } from "@/lib/store-config";

export const metadata = {
  title: "Shipping Policy",
  description: `Shipping Policy for ${storeConfig.storeName}.`,
};

export default function ShippingPolicyPage() {
  return (
    <main className="min-h-screen py-12 sm:py-16">
      <section className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div>
          <p className="inline-block rounded-md border-[1.5px] border-ink bg-white px-2.5 py-1.5 font-mono text-xs font-semibold tracking-wide uppercase">
            Delivery
          </p>
          <h1 className="mt-4 text-5xl leading-none font-extrabold tracking-[-0.045em] text-ink sm:text-6xl">
            Shipping Policy
          </h1>

          <div className="mt-10 space-y-4 text-[15px] leading-7 text-gray-700">
            <p>
              {storeConfig.storeName} delivers to selected locations in{" "}
              {storeConfig.country}. Estimated delivery time is{" "}
              {storeConfig.deliveryTime}.
            </p>

            <section className="rounded-lg border-[1.5px] border-ink bg-white p-6">
              <h2 className="text-2xl font-extrabold text-ink">
                Delivery Areas
              </h2>
              <p className="mt-2">
                Current delivery areas include{" "}
                {storeConfig.deliveryAreas.join(", ")}.
              </p>
            </section>

            <section className="rounded-lg border-[1.5px] border-ink bg-white p-6">
              <h2 className="text-2xl font-extrabold text-ink">
                Delivery Fees
              </h2>
              <p className="mt-2">
                Delivery fees are shown at checkout before payment is completed.
              </p>
            </section>

            <section className="rounded-lg border-[1.5px] border-ink bg-white p-6">
              <h2 className="text-2xl font-extrabold text-ink">
                Failed Delivery
              </h2>
              <p className="mt-2">
                Customers should provide accurate contact and address details.
                Failed delivery attempts may cause delays or extra charges.
              </p>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}