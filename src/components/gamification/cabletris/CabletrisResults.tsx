import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CabletrisProduct } from "@/lib/cabletris/types";
import type { EngineState } from "@/lib/cabletris/engine";

export function CabletrisResults({
  state,
  orderProduct,
  orderTarget,
  onRestart,
}: {
  state: EngineState;
  orderProduct: CabletrisProduct | undefined;
  orderTarget: number;
  onRestart: () => void;
}) {
  const orderName = orderProduct?.brand ?? "";

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-secondary">Игра окончена</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <ResultRow label="Счёт" value={String(state.score)} />
          <ResultRow label="Слияния марок" value={String(state.brandMerges)} />
          <ResultRow label="Слияния категорий" value={String(state.categoryMerges)} />
          <ResultRow label="Лучшее комбо" value={`x${state.bestCombo}`} />
          <ResultRow
            label="Заказ"
            value={
              state.orderCompleted
                ? `Выполнен (${orderName} ${state.orderProgress}/${orderTarget})`
                : `Не выполнен (${orderName} ${state.orderProgress}/${orderTarget})`
            }
          />
          <Button type="button" className="mt-4 w-full" onClick={onRestart}>
            Играть ещё
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-foreground">{value}</span>
    </div>
  );
}
