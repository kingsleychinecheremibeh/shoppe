// Shop listing placeholder: same header band and grid as the real page.
export default function ProductsLoading() {
  const tints = ["#E3E9FF", "#FFE0EF", "#FFF1C2", "#D6F3E5"];
  return (
    <main className="min-h-screen" aria-busy="true">
      <span className="sr-only">Loading products</span>
      <section className="border-b-[1.5px] border-ink bg-sun-soft">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
          <div className="h-16 w-72 animate-pulse rounded-md bg-white/70" />
        </div>
      </section>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 h-11 w-full max-w-2xl animate-pulse rounded-lg bg-canvas" />
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i}>
              <div className="aspect-4/5 animate-pulse rounded-lg border-[1.5px] border-gray-300" style={{ background: tints[i % 4] }} />
              <div className="mt-3 h-4 w-2/3 animate-pulse rounded bg-canvas" />
              <div className="mt-2 h-4 w-1/3 animate-pulse rounded bg-canvas" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
