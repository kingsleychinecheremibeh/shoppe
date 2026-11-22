import { Bone, Card, LoadingPage } from "@/app/components/skeleton";

export default function OrdersLoading() {
  return (
    <LoadingPage label="Loading your orders" width="max-w-5xl">
      <Bone className="h-5 w-24" />
      <Bone className="mt-4 h-14 w-64" />
      <div className="mt-7 flex gap-2">
        {[64, 110, 90].map((w) => (
          <Bone key={w} className="h-11 rounded-lg" style={{ width: w }} />
        ))}
      </div>
      <div className="mt-6 space-y-6">
        {["#D6F3E5", "#FFF1C2"].map((tint) => (
          <div key={tint} className="overflow-hidden rounded-lg border-[1.5px] border-gray-300 bg-white">
            <div className="h-20 animate-pulse" style={{ background: tint }} />
            <div className="grid grid-cols-4 gap-4 p-6">
              {[0, 1, 2, 3].map((i) => (
                <Bone key={i} className="h-12 w-12 rounded-md" />
              ))}
            </div>
            <div className="space-y-3 border-t border-gray-200 p-5">
              <Bone className="h-5 w-1/2" />
              <Bone className="h-4 w-1/4" />
            </div>
          </div>
        ))}
      </div>
    </LoadingPage>
  );
}
