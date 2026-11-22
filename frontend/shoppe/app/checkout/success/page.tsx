"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Loading03Icon, PrinterIcon } from "@hugeicons/core-free-icons";
import { getOrderStatus, shortOrderId } from "@/lib/order-status";
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
  const status = getOrderStatus(isPaid ? "PAID" : "PENDING");

  return (
    <main className="flex min-h-[80vh] items-center justify-center px-4 py-16">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          header, footer, nav, button, a, .no-print { display: none !important; }
          body, main { background: white !important; padding: 0 !important; margin: 0 !important; }
          .print-card { border: none !important; box-shadow: none !important; padding: 0 !important; max-width: 100% !important; }
        }
      `,
        }}
      />

      <div className="print-card w-full max-w-lg overflow-hidden rounded-lg border-[1.5px] border-ink bg-white shadow-sticker">
        {!orderId ? (
          <div className="p-10 text-center">
            <p className="text-base text-gray-700">We couldn&apos;t find an order here. Taking you home…</p>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center p-12" aria-busy="true">
            <HugeiconsIcon icon={Loading03Icon} size={40} className="animate-spin text-gray-500" />
            <p className="mt-4 text-base text-gray-700">Getting your order…</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center px-8 pt-10 pb-8 text-center" style={{ background: status.soft }}>
              <span
                className="flex h-20 w-20 items-center justify-center rounded-lg border-[1.5px] border-ink"
                style={{ background: status.bg, color: status.fg }}
              >
                <HugeiconsIcon icon={status.icon} size={44} strokeWidth={1.6} />
              </span>
              <h1 className="mt-6 text-4xl leading-tight font-extrabold text-ink" aria-live="polite">
                {isPaid ? "Thank you for your order" : "Confirming your payment"}
              </h1>
              <p className="mt-3 max-w-sm text-base leading-relaxed text-gray-700">
                {isPaid
                  ? "Payment received. We're getting your order ready and will update its status as it ships."
                  : "We're waiting for Paystack to confirm your payment. This page updates on its own."}
              </p>
            </div>

            <div className="border-t-[1.5px] border-ink p-6 sm:p-8">
              <dl className="space-y-3 text-[15px]">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-gray-700">Order</dt>
                  <dd className="font-mono font-semibold text-ink" title={orderId}>
                    {shortOrderId(orderId)}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-gray-700">Status</dt>
                  <dd>
                    <span
                      className="inline-flex items-center gap-1.5 rounded-md border-[1.5px] border-ink px-2.5 py-1 text-sm font-semibold"
                      style={{ background: status.bg, color: status.fg }}
                    >
                      {!isPaid && <HugeiconsIcon icon={Loading03Icon} size={16} className="animate-spin" />}
                      {isPaid ? "Paid" : "Awaiting confirmation"}
                    </span>
                  </dd>
                </div>
              </dl>

              {polledOut && !isPaid && (
                <div className="no-print mt-5 rounded-lg bg-sun-soft p-4 text-[15px] text-ink">
                  <p>This is taking longer than usual. If you were charged, your order will update shortly.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setPolledOut(false);
                      setAttempt((value) => value + 1);
                    }}
                    className="mt-3 inline-flex h-10 items-center rounded-lg border-[1.5px] border-ink bg-white px-4 text-sm font-semibold hover:bg-sun"
                  >
                    Check again
                  </button>
                </div>
              )}

              <div className="no-print mt-7 space-y-3">
                <Link
                  href="/account/orders"
                  className="inline-flex h-14 w-full items-center justify-center rounded-lg bg-ink text-base font-semibold text-paper transition hover:bg-black"
                >
                  View my orders
                </Link>
                <div className="flex items-center justify-center gap-6 pt-1">
                  <Link href="/products" className="text-[15px] font-semibold underline-offset-4 hover:underline">
                    Continue shopping
                  </Link>
                  {isPaid && (
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="inline-flex items-center gap-1.5 text-[15px] font-semibold underline-offset-4 hover:underline"
                    >
                      <HugeiconsIcon icon={PrinterIcon} size={20} strokeWidth={1.6} />
                      Print receipt
                    </button>
                  )}
                </div>
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
        <main className="flex min-h-[80vh] items-center justify-center">
          <HugeiconsIcon icon={Loading03Icon} size={40} className="animate-spin text-gray-500" />
        </main>
      }
    >
      <SuccessPageContent />
    </Suspense>
  );
}
