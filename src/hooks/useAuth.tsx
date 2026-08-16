import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "employee" | "manager" | "hr" | "admin" | "teacher";

export interface AuthState {
  user: User | null;
  session: Session | null;
  roles: AppRole[];
  loading: boolean;
  isAdmin: boolean;
  isStaff: boolean;
  isManager: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    /** Сбой подключения к бэкенду не должен ронять публичные страницы: отдаём состояние «гость». */
    try {
      const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
        setSession(next);
        if (!next) setRoles([]);
      });
      void supabase.auth
        .getSession()
        .then(({ data }) => setSession(data.session))
        .catch(() => setSession(null))
        .finally(() => setLoading(false));
      return () => sub.subscription.unsubscribe();
    } catch (e) {
      console.error("[auth] backend unavailable", e);
      setSession(null);
      setRoles([]);
      setLoading(false);
      return;
    }
  }, []);

  useEffect(() => {
    const uid = session?.user?.id;
    if (!uid) return;
    let cancelled = false;
    try {
      void supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", uid)
        .then(({ data }) => {
          if (!cancelled) setRoles(((data ?? []) as { role: AppRole }[]).map((r) => r.role));
        });
    } catch (e) {
      console.error("[auth] roles unavailable", e);
    }
    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

  const value: AuthState = {
    user: session?.user ?? null,
    session,
    roles,
    loading,
    isAdmin: roles.includes("admin"),
    isStaff: roles.includes("admin") || roles.includes("hr"),
    isManager: roles.includes("manager"),
    signOut: async () => {
      await supabase.auth.signOut();
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}