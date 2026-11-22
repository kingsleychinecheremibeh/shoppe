import { Bone, Card, LoadingPage } from "@/app/components/skeleton";

export default function AccountLoading() {
  return (
    <LoadingPage label="Loading your account" width="max-w-5xl">
      <Bone className="h-14 w-64" />
      <Bone className="mt-3 h-5 w-80 max-w-full" />
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {["#2F5BFF", "#FF4FA3", "#1FAF6E"].map((color) => (
          <Card key={color} className="h-44 opacity-40" style={{ background: color }} />
        ))}
      </div>
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="h-56 bg-white" />
        <Card className="h-56 bg-white lg:col-span-2" />
      </div>
    </LoadingPage>
  );
}
