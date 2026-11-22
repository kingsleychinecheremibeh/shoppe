import { Bone, Card, LoadingPage } from "@/app/components/skeleton";

export default function CheckoutLoading() {
  return (
    <LoadingPage label="Loading checkout" width="max-w-6xl">
      <Bone className="h-5 w-32" />
      <Bone className="mt-4 h-14 w-64" />
      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="space-y-10">
          {[0, 1, 2].map((step) => (
            <div key={step} className="space-y-4">
              <div className="flex items-center gap-3">
                <Bone className="h-9 w-9 rounded-md" />
                <Bone className="h-7 w-48" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Card className="h-28 bg-white" />
                {step === 1 && <Card className="h-28 bg-white" />}
              </div>
            </div>
          ))}
        </div>
        <Card className="h-[26rem] bg-white" />
      </div>
    </LoadingPage>
  );
}
