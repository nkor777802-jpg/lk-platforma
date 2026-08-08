import { useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, CircleAlert, Factory, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import {
  finishSimulatorRun,
  startSimulatorRun,
  submitSimulatorStep,
} from "@/lib/simulator.functions";
import { simulatorCatalogQuery } from "@/lib/simulator-queries";
import { CableViewer } from "./CableViewer";
import type { ModelLayer } from "./CableModel3D";
import { EmptyState, InlineLoading } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type RunStep = { stepNumber: number; process: string; comment: string | null; layerCodes: string[] };
type WorkCenter = { code: string; name: string; process: string; area: string | null };
type RunState = {
  runId: string;
  product: { code: string; name: string; brand: string | null; description: string | null };
  steps: RunStep[];
  layers: (ModelLayer & { stepNumber: number | null })[];
  workCenters: WorkCenter[];
  maxScore: number;
};

export function ProductionSimulator() {
  const catalog = useQuery(simulatorCatalogQuery);
  const queryClient = useQueryClient();
  const start = useServerFn(startSimulatorRun);
  const submit = useServerFn(submitSimulatorStep);
  const finish = useServerFn(finishSimulatorRun);

  const [category, setCategory] = useState<string>("");
  const [productCode, setProductCode] = useState<string>("");
  const [run, setRun] = useState<RunState | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [attempt, setAttempt] = useState(1);
  const [feedback, setFeedback] = useState<{ correct: boolean; text: string } | null>(null);
  const [score, setScore] = useState(0);
  const [errors, setErrors] = useState(0);
  const [summary, setSummary] = useState<{ score: number; maxScore: number; errors: number; xp: number } | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const stepStart = useRef<number>(Date.now());

  const products = useMemo(
    () => (catalog.data?.products ?? []).filter((p) => !category || p.category === category),
    [catalog.data, category],
  );

  if (catalog.isLoading) return <InlineLoading />;
  if ((catalog.data?.products ?? []).length === 0)
    return (
      <EmptyState
        title="Производственный паспорт не загружен"
        description="Импортируйте продукцию, рабочие центры и маршруты в админ-панели — тренажёр построится автоматически."
      />
    );

  const currentStep = run?.steps[stepIndex] ?? null;
  const completedSteps = run ? run.steps.slice(0, stepIndex) : [];
  const revealedLayerCodes = new Set(completedSteps.flatMap((s) => s.layerCodes));
  const visibleLayers = run ? run.layers.filter((l) => revealedLayerCodes.has(l.code)) : [];

  const beginRun = async () => {
    if (!productCode) return;
    setBusy(true);
    try {
      const data = (await start({ data: { productCode } })) as RunState;
      setRun(data);
      setStepIndex(0);
      setAttempt(1);
      setScore(0);
      setErrors(0);
      setFeedback(null);
      setSummary(null);
      stepStart.current = Date.now();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось запустить тренажёр");
    } finally {
      setBusy(false);
    }
  };

  const chooseWorkCenter = async (code: string) => {
    if (!run || !currentStep) return;
    setBusy(true);
    try {
      const seconds = Math.round((Date.now() - stepStart.current) / 1000);
      const result = await submit({
        data: {
          runId: run.runId,
          stepNumber: currentStep.stepNumber,
          workCenterCode: code,
          attempt,
          durationSeconds: seconds,
        },
      });
      if (result.correct) {
        setScore((s) => s + result.gained);
        setFeedback({
          correct: true,
          text: result.comment ?? "Операция выполнена, конструкция дополнена новым слоем.",
        });
        const next = stepIndex + 1;
        setStepIndex(next);
        setAttempt(1);
        stepStart.current = Date.now();
        if (next >= run.steps.length) {
          const done = await finish({ data: { runId: run.runId } });
          setSummary({ score: done.score, maxScore: done.maxScore, errors: done.errors, xp: done.xp });
          if (done.awarded) toast.success(`Получено достижений: ${done.awarded}`);
          if (done.zonesUnlocked) toast.success(`Открыто участков завода: ${done.zonesUnlocked}`);
          await queryClient.invalidateQueries({ queryKey: ["gamification"] });
          await queryClient.invalidateQueries({ queryKey: ["simulator", "history"] });
        }
      } else {
        setErrors((e) => e + 1);
        setAttempt((a) => a + 1);
        setFeedback({
          correct: false,
          text:
            result.hint ??
            "Этот рабочий центр не выполняет данную операцию для выбранной марки. Попробуйте ещё раз.",
        });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ошибка проверки операции");
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setRun(null);
    setSummary(null);
    setFeedback(null);
  };

  if (!run)
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Выбор продукции</CardTitle>
          <CardDescription>
            Маршрут, рабочие центры и конструкция загружаются из производственного паспорта.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              value={category}
              onValueChange={(value) => {
                setCategory(value);
                setProductCode("");
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Категория продукции" />
              </SelectTrigger>
              <SelectContent>
                {(catalog.data?.categories ?? []).map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={productCode} onValueChange={setProductCode}>
              <SelectTrigger>
                <SelectValue placeholder="Марка продукции" />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.code} value={p.code}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={beginRun} disabled={!productCode || busy}>
            <Factory className="mr-2 h-4 w-4" />
            Начать сборку
          </Button>
        </CardContent>
      </Card>
    );

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{run.product.name}</CardTitle>
          <CardDescription>{run.product.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Progress value={(stepIndex / Math.max(run.steps.length, 1)) * 100} />
            <p className="text-xs text-muted-foreground">
              Операция {Math.min(stepIndex + 1, run.steps.length)} из {run.steps.length} · баллы {score} из{" "}
              {run.maxScore} · ошибок {errors}
            </p>
          </div>

          {summary ? (
            <div className="space-y-3 rounded-lg border border-primary/40 p-4">
              <p className="font-semibold text-secondary">Кабель полностью собран</p>
              <p className="text-sm text-muted-foreground">
                Результат {summary.score} из {summary.maxScore}, ошибок {summary.errors}, начислено{" "}
                {summary.xp} XP.
              </p>
              <Button onClick={reset} variant="outline">
                <RotateCcw className="mr-2 h-4 w-4" />
                Выбрать другую продукцию
              </Button>
            </div>
          ) : currentStep ? (
            <div className="space-y-3">
              <div>
                <Badge variant="secondary">Операция: {currentStep.process}</Badge>
                <p className="mt-2 text-sm text-muted-foreground">
                  Выберите рабочий центр, на котором выполняется эта операция.
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {run.workCenters.map((w) => (
                  <Button
                    key={w.code}
                    variant="outline"
                    disabled={busy}
                    className="h-auto justify-start whitespace-normal py-2 text-left"
                    onClick={() => chooseWorkCenter(w.code)}
                  >
                    <span>
                      <span className="block text-sm font-medium">{w.name}</span>
                      <span className="block text-xs text-muted-foreground">
                        {w.code} · {w.area ?? "участок не указан"}
                      </span>
                    </span>
                  </Button>
                ))}
              </div>
            </div>
          ) : null}

          {feedback ? (
            <div
              className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${
                feedback.correct ? "border-primary/40" : "border-destructive/40"
              }`}
            >
              {feedback.correct ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
              ) : (
                <CircleAlert className="mt-0.5 h-4 w-4 text-destructive" />
              )}
              <span>{feedback.text}</span>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Конструкция кабеля</CardTitle>
          <CardDescription>Слои появляются по мере выполнения операций.</CardDescription>
        </CardHeader>
        <CardContent>
          <CableViewer layers={visibleLayers} visibleCount={visibleLayers.length} />
        </CardContent>
      </Card>
    </div>
  );
}
