import { storeConfig } from "@/lib/store-config";

export const metadata = {
  title: "FAQ",
  description: `Frequently asked questions for ${storeConfig.storeName}.`,
};

const faqs = [
  {
    question: "How do I place an order?",
    answer: "Add products to your cart, go to checkout, enter your delivery details, and complete payment.",
  },
  {
    question: "What payment methods are accepted?",
    answer: "Available payment methods are shown at checkout. Payment options may include cards, transfers, USSD, or mobile money depending on the payment provider.",
  },
  {
    question: "How long does delivery take?",
    answer: `Estimated delivery time is ${storeConfig.deliveryTime}.`,
  },
  {
    question: "Can I return an item?",
    answer: `Return requests are accepted within ${storeConfig.returnWindowDays} days if the item meets the return conditions.`,
  },
  {
    question: "How do I contact support?",
    answer: `Email ${storeConfig.supportEmail} or call ${storeConfig.supportPhone}.`,
  },
];

export default function FaqPage() {
  return (
    <main className="min-h-screen py-12 sm:py-16">
      <section className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div>
          <p className="inline-block rounded-md border-[1.5px] border-ink bg-white px-2.5 py-1.5 font-mono text-xs font-semibold tracking-wide uppercase">
            Help
          </p>
          <h1 className="mt-4 text-5xl leading-none font-extrabold tracking-[-0.045em] text-ink sm:text-6xl">
            Frequently Asked Questions
          </h1>

          <div className="mt-10 space-y-4">
            {faqs.map((faq) => (
              <section key={faq.question} className="rounded-lg border-[1.5px] border-ink bg-white p-6">
                <h2 className="text-2xl font-extrabold text-ink">
                  {faq.question}
                </h2>
                <p className="mt-2 text-[15px] leading-7 text-gray-700">
                  {faq.answer}
                </p>
              </section>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}