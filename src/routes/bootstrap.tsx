import { createFileRoute } from '@tanstack/react-router'
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { bootstrapFirstAdmin } from "@/lib/admin.functions";
import type { Session } from "@supabase/supabase-js";

export const Route = createFileRoute("/bootstrap")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Первый администратор — Академия «Людиновокабель»" },
      {
        name: "description",
        content: "Назначение первого администратора платформы обучения.",
      },
      { property: "og:title", content: "Первый администратор" },
      { property: "og:description", content: "Назначение первого администратора платформы." },
    ],
  }),
  component: BootstrapPage,
});

function BootstrapPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const bootstrap = useServerFn(bootstrapFirstAdmin);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, next) => {
      setSession(next);
    });
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleBootstrap = async () => {
    if (!session) {
      toast.error("Сначала войдите в систему");
      return;
    }
    setProcessing(true);
    try {
      await bootstrap({ data: undefined });
      toast.success("Вы назначены первым администратором");
      void router.navigate({ to: "/admin", replace: true });
    } catch (e) {
      toast.error("Не удалось назначить администратора", {
        description: e instanceof Error ? e.message : "Неизвестная ошибка",
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted px-4 py-12">
        <p className="text-muted-foreground">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Первый администратор</CardTitle>
          <CardDescription>
            {session
              ? "Назначьте текущего пользователя первым администратором платформы."
              : "Для назначения администратора необходимо войти в систему."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {session ? (
            <>
              <p className="text-sm text-muted-foreground">
                Вошли как: <span className="font-medium text-foreground">{session.user.email}</span>
              </p>
              <Button onClick={handleBootstrap} disabled={processing} className="w-full">
                {processing ? "Назначение..." : "Стать первым администратором"}
              </Button>
            </>
          ) : (
            <Button asChild className="w-full">
              <Link to="/auth">Войти в систему</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
