import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Lock } from "lucide-react";
import {
  gamificationSettingsQuery,
  leaderboardsQuery,
  myGamificationQuery,
} from "@/lib/gamification-queries";
import { simulatorHistoryQuery } from "@/lib/simulator-queries";
import { ProductionSimulator } from "@/components/gamification/ProductionSimulator";
import { QualityLab } from "@/components/gamification/QualityLab";
import { EmptyState, InlineLoading } from "@/components/states";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/gamification/simulator")({
  head: () => ({
    meta: [
      { title: "Производственный тренажёр — Академия «Людиновокабель»" },
      {
        name: "description",
        content:
          "Интерактивный 3D-тренажёр кабельного производства: маршруты, рабочие центры, конструкция кабеля, контроль качества и рейтинги.",
      },
      { property: "og:title", content: "Производственный 3D-тренажёр" },
      {
        property: "og:description",
        content: "Сборка кабеля по реальным технологическим маршрутам предприятия.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SimulatorPage,
});

function SimulatorPage() {
  const settings = useQuery(gamificationSettingsQuery);
  const data = useQuery(myGamificationQuery);
  const boards = useQuery(leaderboardsQuery);
  const history = useQuery(simulatorHistoryQuery);

  if (settings.isLoading || data.isLoading) return <InlineLoading />;
  if (!settings.data?.gamificationEnabled)
    return (
      <EmptyState
        title="Модуль отключён"
        description="Производственный тренажёр отключён администратором платформы."
      />
    );

  const stats = data.data?.stats;
  const xp = data.data?.xp;
  const showBoards = settings.data.leaderboardsEnabled && boards.data?.enabled;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">
          <Link to="/gamification" className="text-primary hover:underline">
            Игры и тренажёры
          </Link>
          {" · "}
          Производственный тренажёр
        </p>
        <h1 className="text-2xl font-bold text-secondary sm:text-3xl">Производственный тренажёр</h1>
        <p className="mt-2 text-muted-foreground">
          Сборка кабеля по реальным маршрутам производственного паспорта. Тренажёр повышает
          вовлечённость, но не заменяет аттестацию — она проходит в разделе{" "}
          <Link to="/tests" className="text-primary hover:underline">
            «Тесты»
          </Link>
          .
        </p>
      </div>

      {xp ? (
        <Card>
          <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center">
            <div>
              <p className="text-3xl font-bold text-primary">Уровень {xp.level}</p>
              <p className="text-sm text-muted-foreground">{xp.xp} опыта</p>
            </div>
            <div className="flex-1 space-y-1">
              <Progress value={Math.max(0, Math.min(xp.progress, 100))} />
              <p className="text-xs text-muted-foreground">
                До следующего уровня: {Math.max(xp.nextFloor - xp.xp, 0)} XP
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {stats ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Кабелей собрано" value={stats.runs_completed} />
          <StatCard label="Верных операций" value={stats.steps_correct} />
          <StatCard label="Дефектов найдено" value={stats.defects_found} />
          <StatCard label="Аттестаций сдано" value={stats.tests_passed} />
        </div>
      ) : null}

      <Tabs defaultValue="simulator">
        <TabsList className="flex w-full flex-wrap justify-start">
          <TabsTrigger value="simulator">Тренажёр</TabsTrigger>
          <TabsTrigger value="quality">Контроль качества</TabsTrigger>
          <TabsTrigger value="achievements">Достижения</TabsTrigger>
          <TabsTrigger value="factory">Виртуальный завод</TabsTrigger>
          <TabsTrigger value="collection">Коллекция профессий</TabsTrigger>
          <TabsTrigger value="history">История</TabsTrigger>
          {showBoards ? <TabsTrigger value="rating">Рейтинг</TabsTrigger> : null}
        </TabsList>

        <TabsContent value="simulator" className="space-y-4 pt-4">
          <ProductionSimulator />
        </TabsContent>

        <TabsContent value="quality" className="pt-4">
          <QualityLab />
        </TabsContent>

        <TabsContent value="achievements" className="pt-4">
          {(data.data?.achievements ?? []).length === 0 ? (
            <EmptyState
              title="Достижения не настроены"
              description="Администратор ещё не добавил производственные значки."
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(data.data?.achievements ?? []).map((a) => (
                <Card key={a.id} className={a.earnedAt ? "border-primary/40" : "opacity-80"}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-base">{a.title}</CardTitle>
                      {a.earnedAt ? (
                        <Badge>Получено</Badge>
                      ) : (
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm text-muted-foreground">{a.description}</p>
                    <Progress value={(a.progress / Math.max(a.conditionValue, 1)) * 100} />
                    <p className="text-xs text-muted-foreground">
                      {a.progress} из {a.conditionValue}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="factory" className="pt-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(data.data?.zones ?? []).map((z) => (
              <Card key={z.id} className={z.unlockedAt ? "border-accent/50" : "opacity-70"}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base">{z.name}</CardTitle>
                    {z.unlockedAt ? (
                      <Badge variant="secondary">Открыт</Badge>
                    ) : (
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground">{z.description}</p>
                  <Progress value={(z.progress / Math.max(z.conditionValue, 1)) * 100} />
                  <p className="text-xs text-muted-foreground">
                    Операций по процессу «{z.process}»: {z.progress} из {z.conditionValue}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="collection" className="pt-4">
          {(data.data?.collection ?? []).length === 0 ? (
            <EmptyState
              title="Коллекция пуста"
              description="Карточки профессий открываются после успешной аттестации."
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(data.data?.collection ?? []).map((c) => (
                <Card key={c.professionId}>
                  {c.imageUrl ? (
                    <img
                      src={c.imageUrl}
                      alt={c.name}
                      loading="lazy"
                      className="h-36 w-full rounded-t-xl object-cover"
                    />
                  ) : null}
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{c.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-muted-foreground">
                    <p>{c.description}</p>
                    <p className="text-xs">
                      Открыто {new Date(c.unlockedAt).toLocaleDateString("ru-RU")}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="pt-4">
          {(history.data ?? []).length === 0 ? (
            <EmptyState
              title="Прохождений пока нет"
              description="Запустите тренажёр — результаты появятся здесь и в аналитике."
            />
          ) : (
            <div className="space-y-2">
              {(history.data ?? []).map((r) => (
                <Card key={r.id}>
                  <CardContent className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-6 text-sm">
                    <span className="font-medium">{r.productName}</span>
                    <Badge variant={r.status === "completed" ? "default" : "outline"}>
                      {r.status === "completed" ? "Собран" : "Не завершён"}
                    </Badge>
                    <span className="text-muted-foreground">
                      {r.score} из {r.maxScore} баллов · ошибок {r.errors} · {r.xp} XP
                    </span>
                    <span className="text-muted-foreground">
                      {new Date(r.startedAt).toLocaleString("ru-RU")}
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {showBoards ? (
          <TabsContent value="rating" className="pt-4">
            <div className="grid gap-4 lg:grid-cols-3">
              <Board title="Сотрудники" rows={boards.data?.byActivity ?? []} />
              <Board title="Подразделения" rows={boards.data?.byDepartment ?? []} />
              <Board title="Профессии" rows={boards.data?.byProfession ?? []} />
            </div>
          </TabsContent>
        ) : null}
      </Tabs>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-3xl font-bold text-primary">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

function Board({
  title,
  rows,
}: {
  title: string;
  rows: { key: string; label: string; points: number }[];
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Данных пока нет.</p>
        ) : (
          rows.map((r, i) => (
            <div key={r.key} className="flex items-center gap-3 text-sm">
              <span className="w-6 text-muted-foreground">{i + 1}</span>
              <span className="flex-1 truncate">{r.label}</span>
              <Badge variant="outline">{r.points}</Badge>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
