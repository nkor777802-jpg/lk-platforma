import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Lock } from "lucide-react";
import {
  gamificationSettingsQuery,
  leaderboardsQuery,
  myGamificationQuery,
  trainersQuery,
} from "@/lib/gamification-queries";
import { TrainerCard, type Trainer } from "@/components/gamification/TrainerCard";
import { EmptyState, InlineLoading } from "@/components/states";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/gamification")({
  head: () => ({
    meta: [
      { title: "Развитие навыков — Академия «Людиновокабель»" },
      {
        name: "description",
        content:
          "Производственные тренажёры, квесты, достижения, виртуальный завод и рейтинги сотрудников кабельного производства.",
      },
      { property: "og:title", content: "Развитие навыков и производственные тренажёры" },
      {
        property: "og:description",
        content: "Практика на производственных сценариях, достижения и рейтинги.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: GamificationPage,
});

const QUEST_TYPES = new Set(["quest", "tech_error"]);

function GamificationPage() {
  const settings = useQuery(gamificationSettingsQuery);
  const data = useQuery(myGamificationQuery);
  const trainers = useQuery(trainersQuery);
  const boards = useQuery(leaderboardsQuery);

  if (settings.isLoading || data.isLoading) return <InlineLoading />;
  if (!settings.data?.gamificationEnabled)
    return (
      <EmptyState
        title="Модуль отключён"
        description="Геймификация отключена администратором платформы."
      />
    );

  const all = (trainers.data ?? []) as Trainer[];
  const simulators = all.filter((t) => !QUEST_TYPES.has(t.taskType));
  const quests = all.filter((t) => QUEST_TYPES.has(t.taskType));
  const stats = data.data?.stats;
  const showBoards = settings.data.leaderboardsEnabled && boards.data?.enabled;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-secondary">Развитие навыков</h1>
        <p className="mt-2 text-muted-foreground">
          Производственные тренажёры и квесты закрепляют технологию, а достижения и участки завода
          открываются по мере обучения. Карьерный прогресс — в разделе{" "}
          <Link to="/development" className="text-primary hover:underline">
            «Развитие»
          </Link>
          .
        </p>
      </div>

      {stats ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Тренажёров пройдено" value={stats.trainers_passed} />
          <StatCard label="Аттестаций сдано" value={stats.tests_passed} />
          <StatCard label="Тестов на 100%" value={stats.perfect_test} />
          <StatCard label="Серия без ошибок" value={stats.perfect_streak} />
        </div>
      ) : null}

      <Tabs defaultValue="trainers">
        <TabsList className="flex w-full flex-wrap justify-start">
          <TabsTrigger value="trainers">Тренажёры</TabsTrigger>
          <TabsTrigger value="quests">Квесты</TabsTrigger>
          <TabsTrigger value="achievements">Достижения</TabsTrigger>
          <TabsTrigger value="factory">Виртуальный завод</TabsTrigger>
          <TabsTrigger value="collection">Коллекция профессий</TabsTrigger>
          {showBoards ? <TabsTrigger value="rating">Рейтинг</TabsTrigger> : null}
        </TabsList>

        <TabsContent value="trainers" className="space-y-4 pt-4">
          {trainers.isLoading ? (
            <InlineLoading />
          ) : simulators.length === 0 ? (
            <EmptyState
              title="Тренажёры не настроены"
              description="Администратор ещё не добавил производственные тренажёры."
            />
          ) : (
            simulators.map((t) => <TrainerCard key={t.id} trainer={t} />)
          )}
        </TabsContent>

        <TabsContent value="quests" className="space-y-4 pt-4">
          {quests.length === 0 ? (
            <EmptyState
              title="Квестов пока нет"
              description="Производственные ситуационные задания появятся здесь."
            />
          ) : (
            quests.map((t) => <TrainerCard key={t.id} trainer={t} />)
          )}
        </TabsContent>

        <TabsContent value="achievements" className="pt-4">
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
                  <Progress value={(a.progress / a.conditionValue) * 100} />
                  <p className="text-xs text-muted-foreground">
                    {a.progress} из {a.conditionValue}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
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
                    {z.progress} из {z.conditionValue}
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

        {showBoards ? (
          <TabsContent value="rating" className="pt-4">
            <div className="grid gap-4 lg:grid-cols-3">
              <Board title="По подразделениям" rows={boards.data?.byDepartment ?? []} />
              <Board title="По профессиям" rows={boards.data?.byProfession ?? []} />
              <Board title="По активности" rows={boards.data?.byActivity ?? []} />
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