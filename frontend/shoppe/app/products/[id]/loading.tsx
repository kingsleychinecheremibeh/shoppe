// Shown instantly while a product page loads, in the same layout as the real page,
// so navigating from a card or the hero never flashes a short page (or the footer).
export default function ProductLoading() {
  return (
    <main className="min-h-screen" aria-busy="true">
      <span className="sr-only">Loading product</span>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="mb-6 h-5 w-56 animate-pulse rounded-md bg-canvas" />
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-14">
          <div className="aspect-square animate-pulse rounded-lg border-[1.5px] border-gray-300 bg-blue-soft" />
          <div className="flex flex-col gap-6">
            <div className="h-9 w-32 animate-pulse rounded-lg bg-canvas" />
            <div className="space-y-3">
              <div className="h-14 w-4/5 animate-pulse rounded-md bg-canvas" />
              <div className="h-14 w-3/5 animate-pulse rounded-md bg-canvas" />
            </div>
            <div className="h-10 w-40 animate-pulse rounded-md bg-canvas" />
            <div className="h-14 w-full animate-pulse rounded-lg border-[1.5px] border-gray-300 bg-white" />
            <div className="flex gap-3">
              <div className="h-14 w-36 animate-pulse rounded-lg bg-canvas" />
              <div className="h-14 flex-1 animate-pulse rounded-lg bg-gray-300" />
            </div>
            <div className="space-y-2 border-t-[1.5px] border-gray-300 pt-5">
              <div className="h-6 w-24 animate-pulse rounded-md bg-canvas" />
              <div className="h-4 w-full animate-pulse rounded bg-canvas" />
              <div className="h-4 w-11/12 animate-pulse rounded bg-canvas" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
