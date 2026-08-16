import { useEffect, useState } from "react";
import { createFileRoute, isRedirect, Outlet, redirect } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/layout/AppShell";
import { getMyConsentStatus } from "@/lib/legal.functions";

/** Заглушка на время проверки сессии и согласия — вместо пустого экрана. */
function AuthenticatedPending() {
  return (
    <div className="flex min-h-screen items-center justify-center gap-3 text-muted-foreground">
      <Loader2 className="h-6 w-6 animate-spin" />
      <span className="text-base">Загрузка личного кабинета…</span>
    </div>
  );
}

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  pendingComponent: AuthenticatedPending,
  beforeLoad: async ({ location }) => {
    /** Защищённые серверные функции не вызываем при пререндере: там нет сессии и серверных переменных. */
    if (typeof window === "undefined") return {};
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });

    /** Без согласия на обработку ПД доступ к внутренним разделам закрыт. */
    if (!location.pathname.startsWith("/legal-consent")) {
      let status: Awaited<ReturnType<typeof getMyConsentStatus>> | undefined;
      try {
        status = await getMyConsentStatus();
      } catch (e) {
        if (isRedirect(e)) throw e;
      }
      if (status?.required && !status.accepted) {
        throw redirect({ to: "/legal-consent" });
      }
    }
    return { user: data.user };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <AuthenticatedPending />;

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
