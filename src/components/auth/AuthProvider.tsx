"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Session =
  | { status: "loading" }
  | { status: "anon" }
  | { status: "member"; firstName: string; lastName: string; email: string; memberNumber: string }
  | { status: "admin"; firstName: string; lastName: string; email: string };

interface AuthCtx {
  session: Session;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth doit être utilisé dans <AuthProvider>");
  return ctx;
}

/** Par défaut, le visiteur n'est jamais connecté : la session est lue depuis un cookie signé côté serveur. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session>({ status: "loading" });

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/session", { cache: "no-store" });
      const data = (await res.json()) as { role: "anon" | "member" | "admin" } & Record<string, string>;
      if (data.role === "member") setSession({ status: "member", firstName: data.firstName, lastName: data.lastName, email: data.email, memberNumber: data.memberNumber });
      else if (data.role === "admin") setSession({ status: "admin", firstName: data.firstName, lastName: data.lastName, email: data.email });
      else setSession({ status: "anon" });
    } catch {
      setSession({ status: "anon" });
    }
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setSession({ status: "anon" });
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);

  const value = useMemo(() => ({ session, refresh, logout }), [session, refresh, logout]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
