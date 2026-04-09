import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { AuthUser } from "../types/auth";

type AuthContextValue = {
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = "dts_frontend_user";

const getInitialUser = (): AuthUser | null => {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUserState] = useState<AuthUser | null>(getInitialUser);

  const setUser = (value: AuthUser | null) => {
    setUserState(value);
    if (value) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
      return;
    }

    localStorage.removeItem(STORAGE_KEY);
  };

  const contextValue = useMemo(() => ({ user, setUser }), [user]);

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
};
