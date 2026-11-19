import { storeConfig } from "@/lib/store-config";

export const metadata = {
  title: "Shipping Policy",
  description: `Shipping Policy for ${storeConfig.storeName}.`,
};

export default function ShippingPolicyPage() {
  return (
    <main className="min-h-screen bg-white py-12 sm:py-16">
      <section className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div>
          <p className="text-sm font-medium text-brand">
            Delivery
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-950 sm:text-4xl">
            Shipping Policy
          </h1>

          <div className="mt-8 space-y-6 text-sm leading-7 text-gray-600">
            <p>
              {storeConfig.storeName} delivers to selected locations in{" "}
              {storeConfig.country}. Estimated delivery time is{" "}
              {storeConfig.deliveryTime}.
            </p>

            <section>
              <h2 className="text-base font-semibold text-gray-950">
                Delivery Areas
              </h2>
              <p className="mt-2">
                Current delivery areas include{" "}
                {storeConfig.deliveryAreas.join(", ")}.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-gray-950">
                Delivery Fees
              </h2>
              <p className="mt-2">
                Delivery fees are shown at checkout before payment is completed.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-gray-950">
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