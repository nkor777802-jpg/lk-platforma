import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { brandLogos } from "@/lib/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Вход в Академию «Людиновокабель»" },
      {
        name: "description",
        content: "Вход и регистрация в корпоративной платформе обучения и аттестации.",
      },
      { property: "og:title", content: "Вход в Академию «Людиновокабель»" },
      { property: "og:description", content: "Доступ к обучению и аттестации сотрудников." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) void router.navigate({ to: "/dashboard", replace: true });
    });
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) void router.navigate({ to: "/dashboard", replace: true });
    });
    return () => sub.subscription.unsubscribe();
  }, [router]);

  const signIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: String(form.get("email") ?? "").trim(),
      password: String(form.get("password") ?? ""),
    });
    setLoading(false);
    if (error) toast.error("Не удалось войти", { description: error.message });
  };

  const google = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Google-вход недоступен", { description: String(result.error) });
      return;
    }
    if (result.redirected) return;
    void router.navigate({ to: "/dashboard", replace: true });
  };

  if (!mounted) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4 py-12">
      <div className="w-full max-w-md">
        <img
          src={brandLogos.fullColor}
          alt={brandLogos.alt}
          className="mx-auto mb-8 h-12 w-auto max-w-[220px] object-contain"
          width={134}
          height={48}
        />
        <Card>
          <CardHeader>
            <CardTitle>Академия «Людиновокабель»</CardTitle>
            <CardDescription>
              Обучение, тестирование и аттестация работников кабельного производства
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={signIn} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="si-email">Рабочий e-mail</Label>
                <Input id="si-email" name="email" type="email" required maxLength={255} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="si-password">Пароль</Label>
                <Input id="si-password" name="password" type="password" required />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                Войти
              </Button>
            </form>

            <div className="my-5 flex items-center gap-3 text-xs uppercase text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              или
              <span className="h-px flex-1 bg-border" />
            </div>
            <Button variant="outline" className="w-full" onClick={google}>
              Войти через Google
            </Button>
            <p className="mt-5 text-center text-sm text-muted-foreground">
              Учётную запись создаёт отдел персонала. Обратитесь к администратору.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}