import { DatabaseZap } from "lucide-react";

export const DataPendingPlaceholder = ({
  title,
  source,
}: {
  title: string;
  source?: string;
}) => (
  <div className="flex flex-col items-center justify-center py-10 text-center">
    <DatabaseZap className="w-8 h-8 text-dash-text-muted mb-3" />
    <p className="text-sm font-medium text-dash-text-secondary">{title}</p>
    <p className="text-xs text-dash-text-muted mt-1">
      Data pending — source not yet connected
    </p>
    {source && (
      <p className="text-[11px] text-dash-text-muted mt-0.5">
        Planned: {source}
      </p>
    )}
  </div>
);
