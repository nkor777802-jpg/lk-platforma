import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { brandLogos } from "@/lib/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

const signUpSchema = z.object({
  fullName: z.string().trim().min(3, "Укажите ФИО полностью").max(120),
  personnelNumber: z.string().trim().max(30).optional(),
  email: z.string().trim().email("Некорректный e-mail").max(255),
  password: z.string().min(8, "Минимум 8 символов").max(72),
});

function AuthPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

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

  const signUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const parsed = signUpSchema.safeParse({
      fullName: form.get("fullName"),
      personnelNumber: form.get("personnelNumber") || undefined,
      email: form.get("email"),
      password: form.get("password"),
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Проверьте поля формы");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: parsed.data.fullName,
          personnel_number: parsed.data.personnelNumber ?? null,
        },
      },
    });
    setLoading(false);
    if (error) {
      toast.error("Не удалось зарегистрироваться", { description: error.message });
      return;
    }
    if (!data.session) {
      setEmailSent(true);
      toast.success("Подтвердите e-mail", {
        description: "Мы отправили письмо со ссылкой подтверждения.",
      });
    }
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
            {emailSent ? (
              <p className="rounded-md bg-accent/10 p-4 text-sm text-foreground">
                Проверьте почту и перейдите по ссылке подтверждения, затем войдите в систему.
              </p>
            ) : null}
            <Tabs defaultValue="signin" className="mt-2">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Вход</TabsTrigger>
                <TabsTrigger value="signup">Регистрация</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={signIn} className="space-y-4 pt-4">
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
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={signUp} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="su-name">ФИО</Label>
                    <Input id="su-name" name="fullName" required maxLength={120} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="su-pn">Табельный номер</Label>
                    <Input id="su-pn" name="personnelNumber" maxLength={30} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="su-email">Рабочий e-mail</Label>
                    <Input id="su-email" name="email" type="email" required maxLength={255} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="su-password">Пароль</Label>
                    <Input id="su-password" name="password" type="password" required minLength={8} />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    Зарегистрироваться
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="my-5 flex items-center gap-3 text-xs uppercase text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              или
              <span className="h-px flex-1 bg-border" />
            </div>
            <Button variant="outline" className="w-full" onClick={google}>
              Войти через Google
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}