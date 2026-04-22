const DashboardLoading = () => (
  <div className="space-y-6 animate-pulse">
    <div>
      <div className="h-7 w-48 bg-dash-bg rounded mb-2" />
      <div className="h-4 w-64 bg-dash-bg/70 rounded" />
    </div>

    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-dash-surface rounded-xl border border-dash-border p-5"
        >
          <div className="h-3 w-20 bg-dash-bg rounded mb-3" />
          <div className="h-6 w-24 bg-dash-bg/70 rounded" />
        </div>
      ))}
    </div>

    <div className="bg-dash-surface rounded-xl border border-dash-border p-5 space-y-3">
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="flex items-center gap-4"
        >
          <div className="h-10 w-10 rounded-full bg-dash-bg" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-40 bg-dash-bg rounded" />
            <div className="h-3 w-64 bg-dash-bg/70 rounded" />
          </div>
          <div className="h-6 w-20 bg-dash-bg rounded" />
        </div>
      ))}
    </div>
  </div>
);

export default DashboardLoading;
