import { Mail, MapPin, Phone } from "lucide-react";
import { storeConfig } from "@/lib/store-config";

export const metadata = {
  title: "Contact",
  description: `Contact ${storeConfig.storeName}.`,
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-white py-12 sm:py-16">
      <section className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div>
          <p className="text-sm font-medium text-brand">
            Support
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-950 sm:text-4xl">
            Contact Us
          </h1>

          <div className="mt-8 grid gap-4 text-sm text-gray-600">
            <a href={`mailto:${storeConfig.supportEmail}`} className="flex items-center gap-3 rounded-2xl bg-canvas p-5 transition hover:bg-brand-soft">
              <Mail className="h-5 w-5 text-brand" />
              {storeConfig.supportEmail}
            </a>

            <a href={`tel:${storeConfig.supportPhone}`} className="flex items-center gap-3 rounded-2xl bg-canvas p-5 transition hover:bg-brand-soft">
              <Phone className="h-5 w-5 text-brand" />
              {storeConfig.supportPhone}
            </a>

            <div className="flex items-center gap-3 rounded-2xl bg-canvas p-5">
              <MapPin className="h-5 w-5 text-brand" />
              {storeConfig.businessAddress}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}