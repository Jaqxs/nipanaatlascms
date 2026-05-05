"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface AuthUser {
  name: string;
  email: string;
  role: "admin" | "sales_ops";
}

interface AuthCtx {
  user: AuthUser | null;
  isAuthenticated: boolean;
  ready: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);
const STORAGE_KEY = "gbms.auth.user";

const DEMO_USERS: Record<string, { name: string; password: string; role: "admin" | "sales_ops" }> = {
  "j.assey@nipana.tz": { name: "Julius Assey", password: "demo", role: "admin" },
  "m.rwey@nipana.tz": { name: "Maria Rweyemamu", password: "demo", role: "sales_ops" },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {}
    setReady(true);
  }, []);

  const login = async (email: string, password: string) => {
    await new Promise((r) => setTimeout(r, 400));
    const record = DEMO_USERS[email.trim().toLowerCase()];
    if (!record) return { ok: false, error: "No account found for that email." };
    if (record.password !== password) return { ok: false, error: "Incorrect password." };
    const u: AuthUser = { name: record.name, email: email.trim().toLowerCase(), role: record.role };
    setUser(u);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(u)); } catch {}
    return { ok: true };
  };

  const logout = () => {
    setUser(null);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  };

  return (
    <Ctx.Provider value={{ user, isAuthenticated: !!user, ready, login, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used within AuthProvider");
  return c;
}
