import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Bolt } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../lib/axios";
import { getApiErrorMessage } from "../utils/errors";

const emailRegex = /^[a-zA-Z0-9-+_.]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const getStrengthScore = (value: string) => {
  let score = 0;

  if (value.length >= 8) score += 1;
  if (/[A-Z]/.test(value)) score += 1;
  if (/[0-9]/.test(value)) score += 1;
  if (/[^a-zA-Z0-9]/.test(value)) score += 1;

  return score;
};

const SignupPage = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validate = () => {
    if (!name || !email || !password) {
      return "Fill all the fields";
    }

    if (name.length < 3) {
      return "Name is too short";
    }

    if (name.length > 32) {
      return "Maximum name length is 32 characters";
    }

    if (!emailRegex.test(email)) {
      return "Invalid Email";
    }

    if (password.length < 8) {
      return "Minimum password length is 8 characters";
    }

    if (password.length > 72) {
      return "Maximum password length is 72 characters";
    }

    return null;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      await api.post("/api/auth/signup", { name: name.trim(), email: email.trim(), password });
      toast.success("Account created successfully");
      navigate("/login", { replace: true });
    } catch (err) {
      const message = getApiErrorMessage(err);
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const strengthScore = getStrengthScore(password);
  const strengthWidth = `${(strengthScore / 4) * 100}%`;
  const strengthLabel =
    strengthScore <= 1 ? "Weak" : strengthScore === 2 ? "Fair" : strengthScore === 3 ? "Good" : "Strong";
  const strengthColor =
    strengthScore <= 1 ? "bg-rose-500" : strengthScore === 2 ? "bg-amber-500" : strengthScore === 3 ? "bg-blue-500" : "bg-emerald-500";

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.07)_1px,transparent_1px)] bg-[size:34px_34px]" />
      <div className="glass-card relative z-10 w-full max-w-md p-7 sm:p-8">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-500/40 bg-violet-500/10 px-3 py-1.5 text-sm font-semibold text-violet-200">
          <Bolt size={14} /> TaskFlow
        </div>

        <h1 className="text-3xl font-bold text-slate-100">Create account</h1>
        <p className="mt-2 text-sm text-slate-300">Set up your workspace and start dispatching jobs.</p>

        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          <div className="relative">
            <input
              id="name"
              value={name}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setName(event.target.value)}
              className="floating-input"
              placeholder="Name"
            />
            <label htmlFor="name" className="floating-label">
              Name
            </label>
          </div>
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
            <div className="mt-3">
              <div className="h-2 rounded-full bg-slate-700">
                <div className={`h-2 rounded-full transition-all duration-300 ${strengthColor}`} style={{ width: strengthWidth }} />
              </div>
              <p className="mt-1 text-xs text-slate-400">Password strength: {password ? strengthLabel : "-"}</p>
            </div>
          </div>

          {error ? <p className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</p> : null}

          <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
            {loading ? "Creating account..." : "Sign up"}
          </button>
        </form>

        <p className="mt-6 text-sm text-slate-300">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-violet-300 hover:text-violet-200">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;
