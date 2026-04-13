const Loading = () => (
  <div>
    {/* Hero skeleton */}
    <section className="relative h-[50vh] md:h-[60vh] bg-brand-charcoal animate-pulse">
      <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16">
        <div className="bg-white/10 rounded h-3 w-32 mb-4" />
        <div className="bg-white/10 rounded h-10 w-48 mb-4" />
        <div className="bg-white/10 rounded h-4 w-full max-w-md" />
      </div>
    </section>
    {/* Breadcrumb + pills skeleton */}
    <section className="py-4 md:py-6 bg-brand-linen border-b border-brand-stone/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 animate-pulse">
        <div className="bg-brand-stone/10 rounded h-3 w-64 mb-4" />
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-brand-stone/10 rounded-full h-10 w-24" />
          ))}
        </div>
      </div>
    </section>
    {/* Product grid skeleton */}
    <section className="py-10 lg:py-16 bg-brand-linen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-brand-stone/10 rounded-lg aspect-square mb-3" />
              <div className="bg-brand-stone/10 rounded h-3 w-16 mb-2" />
              <div className="bg-brand-stone/10 rounded h-4 w-3/4 mb-2" />
              <div className="bg-brand-stone/10 rounded h-3 w-1/3" />
            </div>
          ))}
        </div>
      </div>
    </section>
  </div>
);

export default Loading;
