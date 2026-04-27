import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
};

const EmptyState = ({ title, description, action, icon }: EmptyStateProps) => {
  return (
    <div className="glass-card flex flex-col items-center justify-center px-6 py-12 text-center">
      {icon ? <div className="mb-4 text-violet-300">{icon}</div> : null}
      <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-slate-300">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
};

export default EmptyState;
