import { useEffect, useState } from "react";
import { createFileRoute, isRedirect, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/layout/AppShell";
import { getMyConsentStatus } from "@/lib/legal.functions";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  pendingComponent: () => null,
  beforeLoad: async ({ location }) => {
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

  if (!mounted) return null;

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
