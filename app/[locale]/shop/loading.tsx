const Loading = () => (
  <div className="pt-16 md:pt-20 lg:pt-[116px]">
    <section className="py-10 md:py-20 bg-brand-linen border-b border-brand-stone/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="bg-brand-stone/10 rounded h-3 w-24 mb-4" />
          <div className="bg-brand-stone/10 rounded h-10 w-48 mb-4" />
          <div className="bg-brand-stone/10 rounded h-4 w-96 max-w-full" />
        </div>
      </div>
    </section>
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
