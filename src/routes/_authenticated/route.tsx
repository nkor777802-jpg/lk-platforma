import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/layout/AppShell";
import { getMyConsentStatus } from "@/lib/legal.functions";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });

    /** Без согласия на обработку ПД доступ к внутренним разделам закрыт. */
    if (!location.pathname.startsWith("/legal-consent")) {
      try {
        const status = await getMyConsentStatus();
        if (status.required && !status.accepted) throw redirect({ to: "/legal-consent" });
      } catch (e) {
        if (e && typeof e === "object" && "to" in e) throw e;
      }
    }
    return { user: data.user };
  },
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});