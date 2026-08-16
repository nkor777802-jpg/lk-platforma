import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { CabletrisConfig, CabletrisProduct } from "@/lib/cabletris/types";
import type { EngineState } from "@/lib/cabletris/engine";

export function CabletrisHud({
  config,
  orderProduct,
  state,
  soundOn,
  onToggleSound,
  onPause,
  onResume,
}: {
  config: CabletrisConfig;
  orderProduct: CabletrisProduct | undefined;
  state: EngineState;
  soundOn: boolean;
  onToggleSound: () => void;
  onPause: () => void;
  onResume: () => void;
}) {
  const target = config.mvpOrder.target;
  const progress = Math.min(100, (state.orderProgress / Math.max(target, 1)) * 100);
  const orderName = orderProduct?.brand ?? config.mvpOrder.productId;

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
      <div className="grid min-w-0 flex-1 grid-cols-3 gap-1.5 sm:gap-2">
        <HudStat label="Счёт" value={String(state.score)} />
        <HudStat label="Комбо" value={`x${Math.max(1, state.lastWaveCombo)}`} />
        <div className="rounded-lg border border-border bg-card px-2 py-1.5">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Заказ</p>
          <p className="truncate text-sm font-semibold text-secondary">{orderName}</p>
          <Progress value={progress} className="mt-1" />
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            {state.orderProgress} / {target}
            {state.orderCompleted ? " · выполнен" : ""}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {state.phase === "paused" ? (
          <Button type="button" size="sm" onClick={onResume}>
            <Play className="h-4 w-4" />
            <span className="hidden sm:inline">Продолжить</span>
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onPause}
            disabled={state.phase !== "playing"}
          >
            <Pause className="h-4 w-4" />
            <span className="hidden sm:inline">Пауза</span>
          </Button>
        )}
        <Button
          type="button"
          size="sm"
          variant="ghost"
          aria-pressed={soundOn}
          aria-label={soundOn ? "Звук включён (заглушка)" : "Звук выключен (заглушка)"}
          onClick={onToggleSound}
        >
          {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        </Button>
        {state.orderCompleted ? <Badge>Заказ выполнен</Badge> : null}
      </div>
    </div>
  );
}

function HudStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card px-2 py-1.5">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-lg font-bold text-primary sm:text-xl">{value}</p>
    </div>
  );
}
