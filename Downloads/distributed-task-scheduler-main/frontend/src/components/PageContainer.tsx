import type { ReactNode } from "react";

type PageContainerProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

const PageContainer = ({ title, subtitle, children }: PageContainerProps) => {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
      {subtitle ? <p className="mt-1 text-sm text-slate-600">{subtitle}</p> : null}
      <div className="mt-6">{children}</div>
    </main>
  );
};

export default PageContainer;
