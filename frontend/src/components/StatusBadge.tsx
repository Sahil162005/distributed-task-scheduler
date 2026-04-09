import type { JobStatus } from "../types/job";

type StatusBadgeProps = {
  status: JobStatus;
};

const statusStyles: Record<JobStatus, string> = {
  PENDING: "bg-slate-200 text-slate-700",
  PROCESSING: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-green-100 text-green-700",
  FAILED: "bg-red-100 text-red-700",
  RETRYING: "bg-yellow-100 text-yellow-700",
};

const StatusBadge = ({ status }: StatusBadgeProps) => {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[status]}`}>
      {status}
    </span>
  );
};

export default StatusBadge;
