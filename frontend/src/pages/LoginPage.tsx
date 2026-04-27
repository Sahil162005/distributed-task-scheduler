import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Bolt } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { getApiErrorMessage } from "../utils/errors";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Fill all the fields");
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
      toast.success("Welcome back");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const message = getApiErrorMessage(err);
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.07)_1px,transparent_1px)] bg-[size:34px_34px]" />
      <div className="glass-card relative z-10 w-full max-w-md p-7 sm:p-8">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-500/40 bg-violet-500/10 px-3 py-1.5 text-sm font-semibold text-violet-200">
          <Bolt size={14} /> TaskFlow
        </div>

        <h1 className="text-3xl font-bold text-slate-100">Sign in</h1>
        <p className="mt-2 text-sm text-slate-300">Control and monitor distributed tasks in real time.</p>

        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          <div className="relative">
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setEmail(event.target.value)}
              className="floating-input"
              placeholder="Email"
            />
            <label htmlFor="email" className="floating-label">
              Email
            </label>
          </div>
          <div className="relative">
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setPassword(event.target.value)}
              className="floating-input"
              placeholder="Password"
            />
            <label htmlFor="password" className="floating-label">
              Password
            </label>
          </div>

          {error ? <p className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</p> : null}

          <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-sm text-slate-300">
          Need an account?{" "}
          <Link to="/signup" className="font-semibold text-violet-300 hover:text-violet-200">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
