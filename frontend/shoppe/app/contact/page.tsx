import { Mail, MapPin, Phone } from "lucide-react";
import { storeConfig } from "@/lib/store-config";

export const metadata = {
  title: "Contact",
  description: `Contact ${storeConfig.storeName}.`,
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <section className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-gray-200 bg-white p-6 sm:p-10">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
            Support
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-950">
            Contact Us
          </h1>

          <div className="mt-8 grid gap-4 text-sm text-gray-600">
            <a href={`mailto:${storeConfig.supportEmail}`} className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 hover:border-gray-950">
              <Mail className="h-5 w-5 text-gray-400" />
              {storeConfig.supportEmail}
            </a>

            <a href={`tel:${storeConfig.supportPhone}`} className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 hover:border-gray-950">
              <Phone className="h-5 w-5 text-gray-400" />
              {storeConfig.supportPhone}
            </a>

            <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-4">
              <MapPin className="h-5 w-5 text-gray-400" />
              {storeConfig.businessAddress}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}