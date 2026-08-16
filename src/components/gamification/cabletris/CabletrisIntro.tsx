import type { ReactNode } from "react";
import { Boxes, Layers, MoveHorizontal, Play, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductCard } from "./ProductCard";
import type { CabletrisConfig, CabletrisProduct } from "@/lib/cabletris/types";

/** Краткое описание игры и цели заказа перед стартом. */
export function CabletrisIntro({
  config,
  orderProduct,
  onStart,
}: {
  config: CabletrisConfig;
  orderProduct: CabletrisProduct | undefined;
  onStart: () => void;
}) {
  const orderName = orderProduct?.brand ?? config.mvpOrder.productId;

  return (
    <Card className="max-h-full w-full max-w-md overflow-y-auto">
      <CardHeader className="gap-1">
        <CardTitle className="text-xl text-secondary">{config.title}</CardTitle>
        <p className="text-sm text-muted-foreground">
          Тренажёр на знание марок и категорий кабельной продукции «Людиновокабель».
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2.5">
          <Rule icon={<MoveHorizontal className="h-4 w-4" aria-hidden />}>
            Карточки продукции падают сверху — переставляйте их по колонкам.
          </Rule>
          <Rule icon={<Boxes className="h-4 w-4" aria-hidden />}>
            Три одинаковые марки подряд сливаются в плитку категории.
          </Rule>
          <Rule icon={<Layers className="h-4 w-4" aria-hidden />}>
            Три одинаковые категории дают бонус и дополнительные очки.
          </Rule>
        </ul>

        <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 p-2.5">
          {orderProduct ? (
            <div className="h-14 w-14 shrink-0">
              <ProductCard brand={orderProduct.brand} image={orderProduct.image} compact thumb />
            </div>
          ) : (
            <Sparkles className="h-5 w-5 text-primary" aria-hidden />
          )}
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Заказ смены
            </p>
            <p className="truncate text-sm font-bold text-secondary">{orderName}</p>
            <p className="text-xs text-muted-foreground">
              Нужно собрать: {config.mvpOrder.target} шт.
            </p>
          </div>
        </div>

        <p className="text-xs leading-relaxed text-muted-foreground">
          Управление: ← → и ↓ на клавиатуре. На телефоне — касание по колонке, двойное касание для
          сброса и кнопки под полем.
        </p>

        <Button type="button" size="lg" className="w-full" onClick={onStart}>
          <Play className="h-4 w-4" />
          Начать
        </Button>
      </CardContent>
    </Card>
  );
}

function Rule({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <li className="flex items-start gap-2.5 text-sm text-foreground">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
        {icon}
      </span>
      <span className="leading-snug">{children}</span>
    </li>
  );
}
