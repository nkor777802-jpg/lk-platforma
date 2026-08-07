import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, ClipboardCheck, GraduationCap, Trophy } from "lucide-react";
import { brandLogos } from "@/lib/brand";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Академия «Людиновокабель» — обучение и аттестация" },
      {
        name: "description",
        content:
          "Корпоративная платформа обучения, тестирования и аттестации работников кабельного производства «Людиновокабель».",
      },
      { property: "og:title", content: "Академия «Людиновокабель»" },
      {
        property: "og:description",
        content: "Обучение, тестирование и аттестация работников кабельного производства.",
      },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  { icon: BookOpen, title: "Учебные материалы", text: "Документы, инструкции и видео по каждой профессии и общим темам." },
  { icon: GraduationCap, title: "Профессии завода", text: "Пошаговое обучение: теория, оборудование, технология, безопасность." },
  { icon: ClipboardCheck, title: "Тестирование", text: "Итоговое тестирование и практическое задание с протоколом аттестации." },
  { icon: Trophy, title: "Прогресс и достижения", text: "Личный кабинет, история попыток, значки и рейтинг обучения." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <img src={brandLogos.fullColor} alt={brandLogos.alt} className="h-9 w-auto" />
          <Button asChild>
            <Link to="/auth">Войти</Link>
          </Button>
        </div>
      </header>

      <section className="bg-secondary text-secondary-foreground">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">
              Корпоративная платформа
            </p>
            <h1 className="mt-4 text-4xl font-bold leading-tight sm:text-5xl">
              Академия кабельного производства «Людиновокабель»
            </h1>
            <p className="mt-5 max-w-xl text-lg opacity-90">
              Единая система обучения, проверки знаний и аттестации работников: от истории завода и
              продукции до профессиональных программ, тестов и практических заданий.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/auth">Начать обучение</Link>
              </Button>
            </div>
          </div>
          <div className="rounded-2xl bg-primary/10 p-10">
            <img src={brandLogos.markWhite} alt="" className="mx-auto h-48 w-auto opacity-90" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16">
        <h2 className="text-2xl font-bold text-secondary">Возможности платформы</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-xl border border-border bg-card p-6">
              <f.icon className="h-8 w-8 text-primary" />
              <h3 className="mt-4 text-lg font-semibold text-foreground">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border bg-muted py-8">
        <div className="mx-auto max-w-7xl px-4 text-sm text-muted-foreground">
          © {new Date().getFullYear()} Людиновокабель. Корпоративная платформа обучения.
        </div>
      </footer>
    </div>
  );
}