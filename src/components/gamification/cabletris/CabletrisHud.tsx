import type { ReactNode } from "react";
import { CheckCircle2, Flame, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { CabletrisConfig, CabletrisProduct } from "@/lib/cabletris/types";
import type { EngineState } from "@/lib/cabletris/engine";
import { ProductCard } from "./ProductCard";

export function CabletrisHud({
  config,
  orderProduct,
  nextProduct,
  state,
  soundOn,
  onToggleSound,
  onPause,
  onResume,
}: {
  config: CabletrisConfig;
  orderProduct: CabletrisProduct | undefined;
  nextProduct: CabletrisProduct | undefined;
  state: EngineState;
  soundOn: boolean;
  onToggleSound: () => void;
  onPause: () => void;
  onResume: () => void;
}) {
  const target = config.mvpOrder.target;
  const progress = Math.min(100, (state.orderProgress / Math.max(target, 1)) * 100);
  const orderName = orderProduct?.brand ?? config.mvpOrder.productId;
  const combo = Math.max(1, state.lastWaveCombo);

  return (
    <div className="rounded-2xl border border-secondary/15 bg-secondary p-2 text-secondary-foreground shadow-[var(--shadow-brand)] sm:p-3">
      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-[repeat(2,minmax(0,1fr))_minmax(0,1.4fr)_auto] lg:items-stretch">
        <HudStat label="Счёт" value={state.score.toLocaleString("ru-RU")} />
        <HudStat
          label="Комбо"
          value={`x${combo}`}
          highlight={combo > 1}
          icon={combo > 1 ? <Flame className="h-4 w-4" aria-hidden /> : null}
        />

        <div className="col-span-2 rounded-xl bg-background/10 p-2 sm:p-2.5 lg:col-span-1">
          <div className="flex items-center gap-2.5">
            {orderProduct ? (
              <div className="h-10 w-10 shrink-0 sm:h-14 sm:w-14">
                <ProductCard
                  brand={orderProduct.brand}
                  image={orderProduct.image}
                  categoryId={orderProduct.category_id}
                  compact
                  thumb
                  showLabel={false}
                />
              </div>
            ) : null}
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <p className="truncate text-[13px] font-bold sm:text-sm">
                  <span className="mr-1 text-[10px] font-medium uppercase tracking-[0.14em] opacity-70">
                    Заказ
                  </span>
                  {orderName}
                </p>
                <p className="shrink-0 text-[11px] tabular-nums opacity-80">
                  {state.orderProgress} / {target}
                </p>
              </div>
              <Progress value={progress} className="mt-1 h-1.5 bg-background/20 sm:h-2" />
            </div>
          </div>
        </div>

        <div className="col-span-2 flex items-center justify-between gap-3 lg:col-span-1 lg:flex-col lg:items-end lg:justify-start">
          <div className="flex items-center gap-2">
            <p className="text-[9px] uppercase tracking-[0.12em] opacity-70">Далее</p>
            <div className="h-10 w-10 shrink-0 sm:h-14 sm:w-14">
              {nextProduct ? (
                <ProductCard
                  brand={nextProduct.brand}
                  image={nextProduct.image}
                  categoryId={nextProduct.category_id}
                  compact
                  thumb
                  showLabel={false}
                />
              ) : null}
            </div>
            <p className="min-w-0 truncate text-[11px] font-semibold sm:text-xs">
              {nextProduct?.brand ?? ""}
            </p>
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
                variant="secondary"
                onClick={onPause}
                disabled={state.phase !== "playing"}
              >
                <Pause className="h-4 w-4" />
                <span className="hidden sm:inline">Пауза</span>
              </Button>
            )}
            <Button
              type="button"
              size="icon"
              variant="secondary"
              aria-pressed={soundOn}
              aria-label={soundOn ? "Звук включён" : "Звук выключен"}
              onClick={onToggleSound}
            >
              {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      {state.orderCompleted ? (
        <Badge className="mt-2 gap-1">
          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
          Заказ выполнен
        </Badge>
      ) : null}
    </div>
  );
}

function HudStat({
  label,
  value,
  highlight = false,
  icon = null,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  icon?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl bg-background/10 px-2.5 py-1.5 transition-colors sm:px-3 sm:py-2",
        highlight && "bg-primary text-primary-foreground",
      )}
    >
      <p className="text-[9px] uppercase tracking-[0.14em] opacity-70 sm:text-[10px]">{label}</p>
      <p
        className={cn(
          "flex items-center gap-1.5 text-lg font-bold tabular-nums sm:text-3xl",
          highlight && "animate-pulse motion-reduce:animate-none",
        )}
      >
        {icon}
        {value}
      </p>
    </div>
  );
}