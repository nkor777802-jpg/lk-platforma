import { useEffect, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useCabletris } from "@/hooks/useCabletris";
import { productById, thumbUrl } from "@/lib/cabletris/adapter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CabletrisBoard } from "./CabletrisBoard";
import { CabletrisHud } from "./CabletrisHud";
import { CabletrisResults } from "./CabletrisResults";
import { ProductCard } from "./ProductCard";

export function CabletrisGame() {
  const game = useCabletris();
  const next = productById(game.products, game.state.nextProductId);

  // Предзагрузка облегчённых фото, чтобы плитки не «мигали» пустотой.
  useEffect(() => {
    for (const product of game.products) {
      const img = new Image();
      img.src = thumbUrl(product.image);
    }
  }, [game.products]);

  return (
    <div className="relative space-y-3 overscroll-contain sm:space-y-4">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs text-muted-foreground sm:text-sm">
            <Link to="/gamification" className="text-primary hover:underline">
              Игры и тренажёры
            </Link>
            {" · "}
            {game.config.title}
          </p>
          <h1 className="truncate text-xl font-bold text-secondary sm:text-3xl">
            {game.config.title}
          </h1>
        </div>
        <div className="w-14 shrink-0 sm:w-20">
          <p className="mb-1 text-center text-[10px] uppercase text-muted-foreground">Следующая</p>
          {next ? <ProductCard brand={next.brand} image={next.image} compact thumb /> : null}
        </div>
      </div>

      <CabletrisHud
        config={game.config}
        orderProduct={game.orderProduct}
        state={game.state}
        soundOn={game.soundOn}
        onToggleSound={() => game.setSoundOn((v) => !v)}
        onPause={game.pause}
        onResume={game.resume}
      />

      <div className="relative">
        <CabletrisBoard
          grid={game.state.grid}
          falling={game.state.falling}
          products={game.products}
          fx={game.fx}
          onMove={game.move}
          onDrop={game.drop}
        />

        {game.state.phase === "idle" ? (
          <Overlay>
            <Card className="max-w-sm">
              <CardHeader>
                <CardTitle className="text-secondary">{game.config.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>
                  Собирайте три одинаковые марки, чтобы получить плитку категории. Три одинаковые
                  категории дают бонус. Заказ и очки берутся из настроек игры.
                </p>
                <Button type="button" className="w-full" onClick={game.start}>
                  Начать
                </Button>
              </CardContent>
            </Card>
          </Overlay>
        ) : null}

        {game.state.phase === "countdown" && game.countdown !== null ? (
          <Overlay>
            <p className="text-7xl font-bold text-primary">{game.countdown}</p>
          </Overlay>
        ) : null}

        {game.state.phase === "paused" ? (
          <Overlay>
            <Card className="max-w-sm">
              <CardHeader>
                <CardTitle className="text-secondary">Пауза</CardTitle>
              </CardHeader>
              <CardContent>
                <Button type="button" className="w-full" onClick={game.resume}>
                  Продолжить
                </Button>
              </CardContent>
            </Card>
          </Overlay>
        ) : null}

        {game.state.phase === "gameover" ? (
          <CabletrisResults
            state={game.state}
            orderProduct={game.orderProduct}
            orderTarget={game.config.mvpOrder.target}
            onRestart={game.restart}
          />
        ) : null}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Клавиатура: ← → и ↓. На телефоне: касание по колонке — переставить, двойное касание или
        свайп вниз — сбросить, кнопки под полем — тоже работают.
      </p>
    </div>
  );
}

function Overlay({ children }: { children: ReactNode }) {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/70 p-4 backdrop-blur-[2px]">
      {children}
    </div>
  );
}
