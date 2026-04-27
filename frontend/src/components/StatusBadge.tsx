import type { JobStatus } from "../types/job";

type StatusBadgeProps = {
  status: JobStatus;
  large?: boolean;
};

const statusConfig: Record<
  JobStatus,
  { dot: string; chip: string; label: string; pulse: boolean }
> = {
  PENDING: { dot: "bg-slate-400", chip: "bg-slate-500/15 text-slate-300", label: "Pending", pulse: false },
  PROCESSING: { dot: "bg-blue-400", chip: "bg-blue-500/20 text-blue-300", label: "Processing", pulse: true },
  COMPLETED: { dot: "bg-emerald-400", chip: "bg-emerald-500/20 text-emerald-300", label: "Completed", pulse: false },
  FAILED: { dot: "bg-rose-400", chip: "bg-rose-500/20 text-rose-300", label: "Failed", pulse: false },
  RETRYING: { dot: "bg-amber-400", chip: "bg-amber-500/20 text-amber-300", label: "Retrying", pulse: true },
};

const StatusBadge = ({ status, large = false }: StatusBadgeProps) => {
  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border border-slate-600 px-3 py-1 text-xs font-semibold ${config.chip} ${
        large ? "text-sm" : "text-xs"
      }`}
    >
      <span className="relative inline-flex h-2.5 w-2.5 items-center justify-center">
        {config.pulse ? <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${config.dot} opacity-70`} /> : null}
        <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${config.dot}`} />
      </span>
      {config.label}
    </span>
  );
};

export default StatusBadge;
