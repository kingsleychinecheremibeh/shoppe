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
    <main className="min-h-screen bg-gray-50 py-12">
      <section className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-gray-200 bg-white p-6 sm:p-10">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
            Help
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-950">
            Frequently Asked Questions
          </h1>

          <div className="mt-8 divide-y divide-gray-100">
            {faqs.map((faq) => (
              <section key={faq.question} className="py-5">
                <h2 className="text-base font-bold text-gray-950">
                  {faq.question}
                </h2>
                <p className="mt-2 text-sm leading-7 text-gray-600">
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