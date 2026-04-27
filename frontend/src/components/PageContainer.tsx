import type { ReactNode } from "react";

type PageContainerProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

const PageContainer = ({ title, subtitle, children }: PageContainerProps) => {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-slate-100 sm:text-3xl">{title}</h1>
      {subtitle ? <p className="mt-2 text-sm text-slate-300 sm:text-base">{subtitle}</p> : null}
      <div className="mt-6">{children}</div>
    </main>
  );
};

export default PageContainer;
