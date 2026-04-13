const Loading = () => (
  <div>
    {/* Hero skeleton */}
    <section className="relative h-[70vh] md:h-screen bg-brand-charcoal animate-pulse">
      <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16">
        <div className="bg-white/10 rounded h-3 w-32 mb-4" />
        <div className="bg-white/10 rounded h-12 w-64 mb-4" />
        <div className="bg-white/10 rounded h-4 w-full max-w-xl mb-2" />
        <div className="bg-white/10 rounded h-4 w-3/4 max-w-xl" />
      </div>
    </section>
    {/* Subcategory grid skeleton */}
    <section className="py-12 md:py-20 bg-brand-linen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-brand-stone/10 rounded-xl aspect-[4/3] mb-3" />
              <div className="bg-brand-stone/10 rounded h-5 w-1/2 mb-2" />
              <div className="bg-brand-stone/10 rounded h-3 w-1/4" />
            </div>
          ))}
        </div>
      </div>
    </section>
  </div>
);

export default Loading;
