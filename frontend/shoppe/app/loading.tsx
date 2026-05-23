export default function Loading() {
  return (
    <main className="bg-white min-h-screen">
      {/* Hero Skeleton */}
      <section className="bg-gray-50 border-b border-gray-200 py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7 max-w-xl animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-16 bg-gray-200 rounded w-3/4 mb-6"></div>
              <div className="h-16 bg-gray-200 rounded w-2/3 mb-8"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6 mb-8"></div>
              <div className="flex gap-4">
                <div className="h-12 bg-gray-200 rounded w-40"></div>
                <div className="h-12 bg-gray-200 rounded w-40"></div>
              </div>
            </div>
            <div className="lg:col-span-5 w-full mt-10 lg:mt-0 animate-pulse">
              <div className="aspect-4/5 w-full rounded-2xl bg-gray-200 border border-gray-100"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Products Skeleton */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 bg-white">
        <div className="text-center max-w-md mx-auto mb-12 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mx-auto mb-2"></div>
          <div className="h-8 bg-gray-200 rounded w-2/3 mx-auto"></div>
        </div>
        
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-square bg-gray-200 rounded-lg mb-4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}