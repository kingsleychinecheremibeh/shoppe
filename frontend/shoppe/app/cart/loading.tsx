import { Bone, Card, LoadingPage, TINTS } from "@/app/components/skeleton";

export default function CartLoading() {
  return (
    <LoadingPage label="Loading cart" width="max-w-6xl">
      <Bone className="h-14 w-40" />
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-4">
          {TINTS.slice(0, 2).map((tint) => (
            <div key={tint} className="flex gap-4 rounded-lg border-[1.5px] border-gray-300 bg-white p-4">
              <Card className="h-36 w-28 shrink-0" style={{ background: tint }} />
              <div className="flex-1 space-y-3 pt-1">
                <Bone className="h-5 w-2/3" />
                <Bone className="h-4 w-1/3" />
                <Bone className="mt-6 h-11 w-36 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
        <Card className="h-80 bg-white" />
      </div>
    </LoadingPage>
  );
}
