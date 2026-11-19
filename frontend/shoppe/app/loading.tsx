export default function Loading() {
  return (
    <main className="flex min-h-[60vh] items-center justify-center bg-white" aria-busy="true">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-brand" />
      <span className="sr-only">Loading</span>
    </main>
  );
}
