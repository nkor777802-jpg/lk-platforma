import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { submitContactRequest } from "@/lib/public.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "@tanstack/react-router";

type Errors = Partial<Record<"fullName" | "message" | "contact" | "consent", string>>;

export function ContactForm() {
  const send = useServerFn(submitContactRequest);
  const [values, setValues] = useState({ fullName: "", unit: "", email: "", phone: "", message: "" });
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [sent, setSent] = useState(false);

  const mutation = useMutation({
    mutationFn: (payload: Parameters<typeof send>[0]) => send(payload),
    onSuccess: () => {
      setSent(true);
      setValues({ fullName: "", unit: "", email: "", phone: "", message: "" });
      setConsent(false);
      toast.success("Обращение отправлено. Мы свяжемся с вами.");
    },
    onError: (e: Error) => toast.error(e.message || "Не удалось отправить обращение"),
  });

  const set = (k: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setValues((v) => ({ ...v, [k]: e.target.value }));

  const validate = (): boolean => {
    const next: Errors = {};
    if (values.fullName.trim().length < 2) next.fullName = "Укажите ФИО";
    if (values.message.trim().length < 10) next.message = "Опишите вопрос подробнее (от 10 символов)";
    if (!values.email.trim() && !values.phone.trim()) next.contact = "Укажите e-mail или телефон";
    if (values.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()))
      next.contact = "Некорректный e-mail";
    if (!consent) next.consent = "Без согласия отправка невозможна";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    mutation.mutate({
      data: {
        fullName: values.fullName.trim(),
        unit: values.unit.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        message: values.message.trim(),
        consent: true,
      },
    });
  };

  if (sent) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="text-lg font-semibold text-foreground">Обращение принято</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Отдел персонала свяжется с вами в рабочее время.
        </p>
        <Button variant="outline" className="mt-4" onClick={() => setSent(false)}>
          Отправить ещё одно
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5 rounded-lg border border-border bg-card p-6">
      <p className="text-sm text-muted-foreground">
        Поля, отмеченные <span aria-hidden="true">*</span><span className="sr-only">звёздочкой</span>, обязательны.
      </p>

      <div className="space-y-2">
        <Label htmlFor="fullName">ФИО *</Label>
        <Input
          id="fullName"
          value={values.fullName}
          onChange={set("fullName")}
          maxLength={120}
          required
          aria-invalid={Boolean(errors.fullName)}
          aria-describedby={errors.fullName ? "fullName-error" : undefined}
        />
        {errors.fullName ? <p id="fullName-error" className="text-sm text-destructive">{errors.fullName}</p> : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="unit">Подразделение или должность</Label>
        <Input id="unit" value={values.unit} onChange={set("unit")} maxLength={160} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" type="email" value={values.email} onChange={set("email")} maxLength={255} aria-invalid={Boolean(errors.contact)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Телефон</Label>
          <Input id="phone" type="tel" value={values.phone} onChange={set("phone")} maxLength={40} aria-invalid={Boolean(errors.contact)} />
        </div>
      </div>
      {errors.contact ? <p className="text-sm text-destructive">{errors.contact}</p> : null}

      <div className="space-y-2">
        <Label htmlFor="message">Вопрос *</Label>
        <Textarea
          id="message"
          rows={5}
          value={values.message}
          onChange={set("message")}
          maxLength={2000}
          required
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? "message-error" : undefined}
        />
        {errors.message ? <p id="message-error" className="text-sm text-destructive">{errors.message}</p> : null}
      </div>

      <div className="flex items-start gap-3">
        <Checkbox
          id="consent"
          checked={consent}
          onCheckedChange={(v) => setConsent(v === true)}
          aria-describedby={errors.consent ? "consent-error" : undefined}
        />
        <div>
          <Label htmlFor="consent" className="text-sm font-normal leading-snug">
            Я даю <Link to="/consent" className="underline underline-offset-4">согласие на обработку персональных данных</Link> и
            ознакомлен с <Link to="/privacy" className="underline underline-offset-4">политикой конфиденциальности</Link>. *
          </Label>
          {errors.consent ? <p id="consent-error" className="mt-1 text-sm text-destructive">{errors.consent}</p> : null}
        </div>
      </div>

      <Button type="submit" disabled={!consent || mutation.isPending}>
        {mutation.isPending ? "Отправка…" : "Отправить обращение"}
      </Button>
    </form>
  );
}
