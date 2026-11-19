"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Check, Clock, Loader2, Printer } from "lucide-react";
import Link from "next/link";
import { api } from "../../../lib/api";

interface Order {
  id: string;
  status: string;
}

const POLL_INTERVAL_MS = 2500;
const POLL_TIMEOUT_MS = 30000;

function SuccessPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("orderId");
  const reference = searchParams.get("reference");

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [polledOut, setPolledOut] = useState(false);
  // Bumping this restarts the polling cycle ("Check again").
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!orderId) {
      const timer = setTimeout(() => router.push("/"), 5000);
      return () => clearTimeout(timer);
    }

    let active = true;
    let verified = false;
    let pollInterval: ReturnType<typeof setInterval> | null = null;
    let verificationAttempted = false;

    const stopPolling = () => {
      if (pollInterval) clearInterval(pollInterval);
      pollInterval = null;
    };

    const fetchOrder = async () => {
      try {
        if (reference && !verificationAttempted) {
          verificationAttempted = true;
          await api.verifyPaystack(reference).catch(() => undefined);
        }

        const res = (await api.getOrder(orderId)) as Order;
        if (!active) return;
        setOrder(res);
        setLoading(false);

        if (res?.status === "PAID") {
          verified = true;
          setPolledOut(false);
          stopPolling();
        }
      } catch {
        if (active) setLoading(false);
      }
    };

    void fetchOrder();
    pollInterval = setInterval(fetchOrder, POLL_INTERVAL_MS);

    const timeout = setTimeout(() => {
      stopPolling();
      if (active && !verified) setPolledOut(true);
    }, POLL_TIMEOUT_MS);

    return () => {
      active = false;
      stopPolling();
      clearTimeout(timeout);
    };
  }, [orderId, reference, router, attempt]);

  const isPaid = order?.status === "PAID";

  return (
    <main className="flex min-h-[80vh] items-center justify-center bg-white px-4 py-16">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          header, footer, nav, button, a, .no-print { display: none !important; }
          body, main { background: white !important; padding: 0 !important; margin: 0 !important; }
          .print-card { border: none !important; padding: 0 !important; max-width: 100% !important; }
        }
      `,
        }}
      />

      <div className="print-card w-full max-w-md rounded-3xl bg-canvas p-8 text-center sm:p-10">
        {!orderId ? (
          <div className="py-6">
            <p className="text-sm text-gray-500">We couldn&apos;t find an order here. Taking you home…</p>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <p className="mt-4 text-sm text-gray-500">Getting your order…</p>
          </div>
        ) : (
          <>
            <div
              className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${
                isPaid ? "bg-emerald-100 text-emerald-700" : "bg-brand-soft text-brand"
              }`}
            >
              {isPaid ? <Check className="h-7 w-7" /> : <Clock className="h-7 w-7" />}
            </div>

            <h1 className="mt-6 text-2xl font-semibold tracking-tight text-gray-950">
              {isPaid ? "Thank you for your order" : "Confirming your payment"}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              {isPaid
                ? "Payment received. We're getting your order ready and will update its status as it ships."
                : "We're waiting for Paystack to confirm your payment. This page updates on its own."}
            </p>

            <dl className="mt-8 space-y-3 rounded-2xl bg-white p-5 text-left text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Order</dt>
                <dd className="truncate font-mono text-xs leading-5 text-gray-900">{orderId}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Status</dt>
                <dd>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      isPaid ? "bg-emerald-50 text-emerald-700" : "bg-brand-soft text-brand"
                    }`}
                  >
                    {!isPaid && <Loader2 className="h-3 w-3 animate-spin" />}
                    {isPaid ? "Paid" : "Awaiting confirmation"}
                  </span>
                </dd>
              </div>
            </dl>

            {polledOut && !isPaid && (
              <div className="no-print mt-4 rounded-2xl bg-white p-4 text-sm text-gray-600">
                <p>This is taking longer than usual. If you were charged, your order will update shortly.</p>
                <button
                  type="button"
                  onClick={() => {
                    setPolledOut(false);
                    setAttempt((value) => value + 1);
                  }}
                  className="mt-3 text-sm font-medium text-brand transition hover:text-brand-hover"
                >
                  Check again
                </button>
              </div>
            )}

            <div className="no-print mt-8 space-y-3">
              <Link
                href="/account/orders"
                className="inline-flex h-12 w-full items-center justify-center rounded-full bg-brand text-sm font-medium text-white transition hover:bg-brand-hover"
              >
                View my orders
              </Link>
              <div className="flex items-center justify-center gap-6 pt-1">
                <Link href="/products" className="text-sm font-medium text-gray-600 transition hover:text-gray-950">
                  Continue shopping
                </Link>
                {isPaid && (
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 transition hover:text-gray-950"
                  >
                    <Printer className="h-4 w-4" />
                    Print receipt
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-[80vh] items-center justify-center bg-white">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </main>
      }
    >
      <SuccessPageContent />
    </Suspense>
  );
}
