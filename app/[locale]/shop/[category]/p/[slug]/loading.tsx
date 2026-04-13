const Loading = () => (
  <div className="pt-16 md:pt-20">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb skeleton */}
      <div className="animate-pulse mb-8">
        <div className="bg-brand-stone/10 rounded h-3 w-72" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Image gallery skeleton */}
        <div className="animate-pulse">
          <div className="bg-brand-stone/10 rounded-xl aspect-square mb-4" />
          <div className="flex gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-brand-stone/10 rounded-lg w-20 h-20" />
            ))}
          </div>
        </div>

        {/* Product info skeleton */}
        <div className="animate-pulse space-y-4">
          <div className="bg-brand-stone/10 rounded h-3 w-24" />
          <div className="bg-brand-stone/10 rounded h-8 w-3/4" />
          <div className="bg-brand-stone/10 rounded h-6 w-32" />
          <div className="bg-brand-stone/10 rounded h-px w-full my-6" />
          <div className="space-y-2">
            <div className="bg-brand-stone/10 rounded h-4 w-full" />
            <div className="bg-brand-stone/10 rounded h-4 w-5/6" />
            <div className="bg-brand-stone/10 rounded h-4 w-4/6" />
          </div>
          <div className="bg-brand-stone/10 rounded-lg h-12 w-full mt-8" />
        </div>
      </div>
    </div>
  </div>
);

export default Loading;
