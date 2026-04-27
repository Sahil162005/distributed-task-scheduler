import { SearchX } from "lucide-react";
import { Link } from "react-router-dom";

const NotFoundPage = () => {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="glass-card w-full max-w-md p-8 text-center">
        <div className="mx-auto mb-4 inline-flex rounded-full border border-slate-700 bg-slate-900/70 p-3 text-violet-300">
          <SearchX size={26} />
        </div>
        <h1 className="text-2xl font-bold text-slate-100">Page not found</h1>
        <p className="mt-2 text-sm text-slate-300">The page you requested does not exist or has moved.</p>
        <Link
          to="/dashboard"
          className="btn-primary mt-6"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
