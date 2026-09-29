"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

/** État de l'abonnement de la membre (voir membershipState côté serveur) : pilote les appels à l'action d'adhésion. */
export type MembershipState = "active" | "pending" | "expired" | "none" | "suspended" | "expelled";

export type Session =
  | { status: "loading" }
  | { status: "anon" }
  | { status: "member"; firstName: string; lastName: string; email: string; memberNumber: string; membership: MembershipState }
  | { status: "admin"; firstName: string; lastName: string; email: string };

interface AuthCtx {
  session: Session;
  /** Plafond de la première vague d'adhésions (Configuration > Adhésions) : `null` tant que l'information n'est pas connue. */
  capReached: boolean | null;
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
export function AuthProvider({ children, initial, initialCapReached }: { children: ReactNode; initial?: Session; initialCapReached?: boolean }) {
  // `initial` : la membre connectée est connue dès le rendu serveur, les appels à l'action d'adhésion n'apparaissent donc jamais à tort.
  const [session, setSession] = useState<Session>(initial ?? { status: "loading" });
  const [capReached, setCapReached] = useState<boolean | null>(initialCapReached ?? null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/session", { cache: "no-store" });
      const data = (await res.json()) as { role: "anon" | "member" | "admin"; membership?: MembershipState; capReached?: boolean } & Record<string, string>;
      if (data.role === "member") setSession({ status: "member", firstName: data.firstName, lastName: data.lastName, email: data.email, memberNumber: data.memberNumber, membership: data.membership ?? "none" });
      else if (data.role === "admin") setSession({ status: "admin", firstName: data.firstName, lastName: data.lastName, email: data.email });
      else setSession({ status: "anon" });
      setCapReached(Boolean(data.capReached));
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

  const value = useMemo(() => ({ session, capReached, refresh, logout }), [session, capReached, refresh, logout]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
