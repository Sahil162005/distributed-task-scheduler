import { Bolt, LogOut, UserRound } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success("Signed out successfully");
    navigate("/login", { replace: true });
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-700/80 bg-slate-950/80 backdrop-blur-lg">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/dashboard" className="group inline-flex items-center gap-2 text-lg font-bold text-slate-100">
          <span className="rounded-lg bg-violet-500/20 p-2 text-violet-300 transition group-hover:bg-violet-500/30">
            <Bolt size={16} />
          </span>
          TaskFlow
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          {user ? <span className="hidden items-center gap-2 rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1.5 text-sm text-slate-300 sm:inline-flex"><UserRound size={14} /> {user.email}</span> : null}
          <button type="button" onClick={handleLogout} className="btn-secondary gap-2 px-3 py-2">
            <LogOut size={16} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
