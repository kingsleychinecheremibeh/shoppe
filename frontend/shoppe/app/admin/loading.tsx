import { Bone, Card, LoadingPage, SOLIDS } from "@/app/components/skeleton";

export default function AdminLoading() {
  return (
    <LoadingPage label="Loading dashboard">
      <Bone className="h-7 w-32 rounded-md" />
      <Bone className="mt-3 h-14 w-80" />
      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {SOLIDS.map((color) => (
          <div key={color} className="space-y-4 rounded-lg border-[1.5px] border-gray-300 bg-white p-5">
            <div className="h-14 w-14 animate-pulse rounded-lg opacity-40" style={{ background: color }} />
            <Bone className="h-8 w-24" />
            <Bone className="h-4 w-20" />
          </div>
        ))}
      </div>
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
        <Card className="h-80 bg-white" />
        <Card className="h-80 bg-white" />
      </div>
    </LoadingPage>
  );
}
