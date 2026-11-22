import { Bone, Card, LoadingPage, SOLIDS } from "@/app/components/skeleton";

export default function CategoriesLoading() {
  return (
    <LoadingPage label="Loading categories">
      <Bone className="h-5 w-24" />
      <Bone className="mt-4 h-16 w-80" />
      <Bone className="mt-4 h-5 w-96 max-w-full" />
      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SOLIDS.map((color) => (
          <Card key={color} className="h-56 opacity-40" style={{ background: color }} />
        ))}
      </div>
    </LoadingPage>
  );
}
