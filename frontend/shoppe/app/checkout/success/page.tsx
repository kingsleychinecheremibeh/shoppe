"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, ShoppingBag, ArrowRight, Sparkles, Printer, Loader2 } from "lucide-react";
import Link from "next/link";
import { api } from "../../../lib/api";

interface Order {
  id: string;
  status: string;
}

function SuccessPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("orderId");

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  // Poll order status if it is still PENDING
  useEffect(() => {
    if (!orderId) {
      const timer = setTimeout(() => {
        router.push("/");
      }, 5000);
      return () => clearTimeout(timer);
    }

    let isMounted = true;
    let pollInterval: NodeJS.Timeout | null = null;

    const fetchOrder = async () => {
      try {
        const res = (await api.getOrder(orderId)) as unknown as Order;
        if (!isMounted) return;
        setOrder(res);
        setLoading(false);

        // Once the order is PAID, clear the polling interval
        if (res && res.status === "PAID") {
          if (pollInterval) clearInterval(pollInterval);
        }
      } catch {}
    };

    void fetchOrder();

    // Poll every 2 seconds
    pollInterval = setInterval(fetchOrder, 2000);

    // Stop polling after 30 seconds to prevent unnecessary server load
    const timeout = setTimeout(() => {
      if (pollInterval) clearInterval(pollInterval);
    }, 30000);

    return () => {
      isMounted = false;
      if (pollInterval) clearInterval(pollInterval);
      clearTimeout(timeout);
    };
  }, [orderId, router]);

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <main className="min-h-[80vh] flex items-center justify-center bg-gray-50/50 py-16 px-4">
      {/* Scoped print CSS to cleanly print only the invoice card, hiding store headers, footers and buttons */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          /* Hide global layouts, store navigation, headers, footers, and page buttons */
          header, footer, nav, aside, button, a, .no-print {
            display: none !important;
          }
          body, main {
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .print-card {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
            margin: 2rem auto !important;
          }
        }
      `}} />

      <div className="print-card max-w-md w-full bg-white rounded-2xl border border-gray-100 shadow-xl p-8 text-center relative overflow-hidden">
        {/* Decorative Top Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gray-950 no-print" />
        
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center">
            <Loader2 className="h-10 w-10 text-gray-950 animate-spin mb-4" />
            <p className="text-sm text-gray-500 font-medium">Fetching order details...</p>
          </div>
        ) : (
          <>
            {/* Animated Icon Area based on Payment Status */}
            {order?.status === "PAID" ? (
              <div className="mx-auto h-20 w-20 bg-green-50 rounded-full flex items-center justify-center mb-6 relative">
                <div className="absolute inset-0 rounded-full bg-green-100 animate-ping opacity-25 scale-75 no-print" />
                <CheckCircle2 className="h-10 w-10 text-green-600 stroke-[1.5] relative z-10" />
              </div>
            ) : (
              <div className="mx-auto h-20 w-20 bg-amber-50 rounded-full flex items-center justify-center mb-6 relative">
                <div className="absolute inset-0 rounded-full bg-amber-100 animate-pulse opacity-75 scale-90 no-print" />
                <Loader2 className="h-10 w-10 text-amber-500 animate-spin stroke-[1.5] relative z-10" />
              </div>
            )}

            {/* Text Headers */}
            {order?.status === "PAID" ? (
              <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest bg-green-50 border border-green-100 text-green-700 px-3 py-1 rounded-full font-bold mb-3 no-print">
                <Sparkles className="h-3 w-3" /> Payment Verified
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest bg-amber-50 border border-amber-100 text-amber-700 px-3 py-1 rounded-full font-bold mb-3 no-print">
                <Loader2 className="h-3 w-3 animate-spin" /> Verifying Payment
              </span>
            )}

            <h1 className="text-2xl font-black text-gray-950 tracking-tight mb-2">
              {order?.status === "PAID" ? "Thank you for your order!" : "We're verifying your payment"}
            </h1>
            
            <p className="text-sm text-gray-500 leading-relaxed mb-6">
              {order?.status === "PAID" 
                ? "Your payment was securely verified. We are preparing the quiet details to elevate your daily life."
                : "We are waiting for payment confirmation from Paystack. This page will update automatically when confirmed."}
            </p>

            {/* Order Identification Box */}
            {orderId ? (
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 mb-8 text-left">
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block mb-1">
                  Order Reference ID
                </span>
                <span className="font-mono text-xs font-bold text-gray-800 break-all block">
                  {orderId}
                </span>
                
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block mt-3 mb-1">
                  Order Status
                </span>
                <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md ${
                  order?.status === "PAID" 
                    ? "bg-green-100 text-green-800 border border-green-200" 
                    : "bg-amber-100 text-amber-800 border border-amber-200 animate-pulse"
                }`}>
                  {order?.status === "PAID" ? "PAID" : "PENDING CONFIRMATION"}
                </span>

                <span className="text-[11px] text-gray-400 block mt-3">
                  {order?.status === "PAID"
                    ? "A copy of your receipt has been generated in your account order tracker."
                    : "You can safely close this tab. We will process your order and email your receipt as soon as Paystack confirms the transfer."}
                </span>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 mb-8 text-center text-xs text-gray-500">
                Redirecting to home page shortly...
              </div>
            )}

            {/* Navigation CTAs (Hidden during printing) */}
            <div className="space-y-3 no-print">
              <Link
                href="/products"
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gray-950 py-3.5 px-4 text-sm font-semibold text-white transition hover:bg-gray-800 shadow-sm"
              >
                <ShoppingBag className="h-4 w-4" />
                Continue Shopping
              </Link>

              {order?.status === "PAID" && (
                <button
                  onClick={handlePrint}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-white border border-gray-200 py-3 text-sm font-semibold text-gray-700 hover:text-gray-950 hover:bg-gray-50 transition shadow-xs"
                >
                  <Printer className="h-4 w-4 text-gray-500" />
                  Print / Save Invoice
                </button>
              )}
              
              <Link
                href="/"
                className="w-full inline-flex items-center justify-center gap-1 rounded-xl bg-white border border-gray-200 py-3 text-sm font-semibold text-gray-600 hover:text-gray-950 hover:bg-gray-50 transition"
              >
                Back to Home
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <main className="min-h-[80vh] flex items-center justify-center bg-gray-50/50">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-t-transparent border-gray-950" />
      </main>
    }>
      <SuccessPageContent />
    </Suspense>
  );
}
