import { storeConfig } from "@/lib/store-config";

export const metadata = {
  title: "Refund and Return Policy",
  description: `Refund and Return Policy for ${storeConfig.storeName}.`,
};

export default function RefundPolicyPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <section className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-gray-200 bg-white p-6 sm:p-10">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
            Customer Care
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-950">
            Refund and Return Policy
          </h1>

          <div className="mt-8 space-y-6 text-sm leading-7 text-gray-600">
            <p>
              {storeConfig.storeName} accepts return requests within{" "}
              {storeConfig.returnWindowDays} days of delivery, provided the item
              is unused, undamaged, and in its original packaging.
            </p>

            <section>
              <h2 className="text-base font-bold text-gray-950">
                Return Conditions
              </h2>
              <p className="mt-2">
                Items must include proof of purchase and must be returned in the
                condition received. Some items may not be eligible for return due
                to hygiene, customization, clearance, or final-sale restrictions.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-950">
                Damaged or Wrong Items
              </h2>
              <p className="mt-2">
                If you receive a damaged or incorrect item, contact us as soon as
                possible with your order number and clear photos of the item.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-950">Refunds</h2>
              <p className="mt-2">
                Approved refunds are processed within{" "}
                {storeConfig.refundProcessingDays}. Refund timing may also
                depend on the payment provider or bank.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-950">
                Start a Return
              </h2>
              <p className="mt-2">
                Contact{" "}
                <a className="font-semibold text-gray-950 underline" href={`mailto:${storeConfig.supportEmail}`}>
                  {storeConfig.supportEmail}
                </a>{" "}
                or WhatsApp {storeConfig.whatsappNumber}.
              </p>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}