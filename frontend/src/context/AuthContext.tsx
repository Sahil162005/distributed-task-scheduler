import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import api, { AUTH_STORAGE_KEY } from "../lib/axios";
import { connectSocket, disconnectSocket } from "../lib/socket";
import type { AuthUser } from "../types/auth";

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setAuthState: (next: { user: AuthUser | null; token: string | null }) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type StoredAuth = {
  user: AuthUser;
  token?: string;
};

const getInitialAuth = (): { user: AuthUser | null; token: string | null } => {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);

  if (!raw) {
    return { user: null, token: null };
  }

  try {
    const parsed = JSON.parse(raw) as StoredAuth;
    return { user: parsed.user, token: parsed.token ?? null };
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return { user: null, token: null };
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const initial = getInitialAuth();
  const [user, setUser] = useState<AuthUser | null>(initial.user);
  const [token, setToken] = useState<string | null>(initial.token);
  const [loading, setLoading] = useState(true);

  const setAuthState = useCallback((next: { user: AuthUser | null; token: string | null }) => {
    setUser(next.user);
    setToken(next.token);

    if (next.user) {
      localStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify({
          user: next.user,
          token: next.token ?? undefined,
        })
      );
      connectSocket();
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      disconnectSocket();
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!raw) {
        if (mounted) {
          setLoading(false);
        }
        return;
      }

      try {
        await api.get("/api/auth/me");
      } catch {
        // This backend may not provide /api/auth/me; keep local session unless 401 interceptor clears it.
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void bootstrap();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (user) {
      connectSocket();
    }
  }, [user]);

  const login = useCallback(async (email: string, password: string) => {
    const response = await api.post<{ user: AuthUser; token?: string }>("/api/auth/login", {
      email,
      password,
    });

    setAuthState({
      user: response.data.user,
      token: response.data.token ?? null,
    });
  }, [setAuthState]);

  const logout = useCallback(async () => {
    try {
      await api.post("/api/auth/logout");
    } catch {
      // Log out locally even if API request fails.
    }

    setAuthState({ user: null, token: null });
  }, [setAuthState]);

  const contextValue = useMemo(
    () => ({ user, token, loading, login, logout, setAuthState }),
    [user, token, loading, login, logout, setAuthState]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
};
