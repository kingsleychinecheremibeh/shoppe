import { storeConfig } from "@/lib/store-config";

export const metadata = {
  title: "Shipping Policy",
  description: `Shipping Policy for ${storeConfig.storeName}.`,
};

export default function ShippingPolicyPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <section className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-gray-200 bg-white p-6 sm:p-10">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
            Delivery
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-950">
            Shipping Policy
          </h1>

          <div className="mt-8 space-y-6 text-sm leading-7 text-gray-600">
            <p>
              {storeConfig.storeName} delivers to selected locations in{" "}
              {storeConfig.country}. Estimated delivery time is{" "}
              {storeConfig.deliveryTime}.
            </p>

            <section>
              <h2 className="text-base font-bold text-gray-950">
                Delivery Areas
              </h2>
              <p className="mt-2">
                Current delivery areas include{" "}
                {storeConfig.deliveryAreas.join(", ")}.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-950">
                Delivery Fees
              </h2>
              <p className="mt-2">
                Delivery fees are shown at checkout before payment is completed.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-950">
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