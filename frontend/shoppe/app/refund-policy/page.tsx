import { storeConfig } from "@/lib/store-config";

export const metadata = {
  title: "Refund and Return Policy",
  description: `Refund and Return Policy for ${storeConfig.storeName}.`,
};

export default function RefundPolicyPage() {
  return (
    <main className="min-h-screen py-12 sm:py-16">
      <section className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div>
          <p className="inline-block rounded-md border-[1.5px] border-ink bg-white px-2.5 py-1.5 font-mono text-xs font-semibold tracking-wide uppercase">
            Customer Care
          </p>
          <h1 className="mt-4 text-5xl leading-none font-extrabold tracking-[-0.045em] text-ink sm:text-6xl">
            Refund and Return Policy
          </h1>

          <div className="mt-10 space-y-4 text-[15px] leading-7 text-gray-700">
            <p>
              {storeConfig.storeName} accepts return requests within{" "}
              {storeConfig.returnWindowDays} days of delivery, provided the item
              is unused, undamaged, and in its original packaging.
            </p>

            <section className="rounded-lg border-[1.5px] border-ink bg-white p-6">
              <h2 className="text-2xl font-extrabold text-ink">
                Return Conditions
              </h2>
              <p className="mt-2">
                Items must include proof of purchase and must be returned in the
                condition received. Some items may not be eligible for return due
                to hygiene, customization, clearance, or final-sale restrictions.
              </p>
            </section>

            <section className="rounded-lg border-[1.5px] border-ink bg-white p-6">
              <h2 className="text-2xl font-extrabold text-ink">
                Damaged or Wrong Items
              </h2>
              <p className="mt-2">
                If you receive a damaged or incorrect item, contact us as soon as
                possible with your order number and clear photos of the item.
              </p>
            </section>

            <section className="rounded-lg border-[1.5px] border-ink bg-white p-6">
              <h2 className="text-2xl font-extrabold text-ink">Refunds</h2>
              <p className="mt-2">
                Approved refunds are processed within{" "}
                {storeConfig.refundProcessingDays}. Refund timing may also
                depend on the payment provider or bank.
              </p>
            </section>

            <section className="rounded-lg border-[1.5px] border-ink bg-white p-6">
              <h2 className="text-2xl font-extrabold text-ink">
                Start a Return
              </h2>
              <p className="mt-2">
                Contact{" "}
                <a className="font-semibold text-ink underline underline-offset-4" href={`mailto:${storeConfig.supportEmail}`}>
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