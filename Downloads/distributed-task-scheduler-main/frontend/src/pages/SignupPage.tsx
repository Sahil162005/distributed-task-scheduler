import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiClient } from "../api/client";
import { getApiErrorMessage } from "../utils/errors";

const emailRegex = /^[a-zA-Z0-9-+_.]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

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
      await apiClient.post("/api/auth/signup", { name, email, password });
      navigate("/login", { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Create account</h1>
        <p className="mt-1 text-sm text-slate-600">Sign up to submit and track background jobs.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-slate-700">
              Name
            </label>
            <input
              id="name"
              value={name}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setName(event.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none ring-brand-500 focus:ring"
              placeholder="Test User"
            />
          </div>
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setEmail(event.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none ring-brand-500 focus:ring"
              placeholder="testuser@gmail.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setPassword(event.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none ring-brand-500 focus:ring"
              placeholder="********"
            />
          </div>

          {error ? <p className="rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-brand-600 px-3 py-2 font-medium text-white hover:bg-brand-500 disabled:opacity-70"
          >
            {loading ? "Creating account..." : "Sign up"}
          </button>
        </form>

        <p className="mt-4 text-sm text-slate-600">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-brand-600 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;
