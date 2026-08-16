import { useCallback, useEffect, useRef } from "react";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { categoryLabel, productById } from "@/lib/cabletris/adapter";
import type { CabletrisProduct, FallingPiece, GridCell, MergeFx } from "@/lib/cabletris/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CategoryTile } from "./CategoryTile";
import { ProductCard } from "./ProductCard";

const SWIPE_MIN = 24;
const TAP_MAX = 12;

export function CabletrisBoard({
  grid,
  falling,
  products,
  fx,
  onMove,
  onDrop,
}: {
  grid: GridCell[][];
  falling: FallingPiece | null;
  products: CabletrisProduct[];
  fx: MergeFx[];
  onMove: (dCol: number) => void;
  onDrop: () => void;
}) {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const rootRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const origin = useRef<{ x: number; y: number } | null>(null);
  const lastTap = useRef(0);
  const onMoveRef = useRef(onMove);
  const onDropRef = useRef(onDrop);
  onMoveRef.current = onMove;
  onDropRef.current = onDrop;
  const fallingColRef = useRef<number | null>(falling?.col ?? null);
  fallingColRef.current = falling?.col ?? null;

  /** Перемещает падающую карточку в колонку под точкой касания. */
  const moveToPoint = useCallback(
    (clientX: number) => {
      const box = gridRef.current?.getBoundingClientRect();
      const from = fallingColRef.current;
      if (!box || from === null || cols === 0) return;
      const ratio = (clientX - box.left) / box.width;
      const target = Math.min(cols - 1, Math.max(0, Math.floor(ratio * cols)));
      const step = target > from ? 1 : -1;
      for (let i = 0; i < Math.abs(target - from); i += 1) onMoveRef.current(step);
    },
    [cols],
  );

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const start = (e: TouchEvent) => {
      const t = e.changedTouches[0];
      if (!t) return;
      origin.current = { x: t.clientX, y: t.clientY };
    };
    const move = (e: TouchEvent) => {
      if (!origin.current) return;
      e.preventDefault();
    };
    const end = (e: TouchEvent) => {
      const from = origin.current;
      origin.current = null;
      const t = e.changedTouches[0];
      if (!from || !t) return;
      const dx = t.clientX - from.x;
      const dy = t.clientY - from.y;
      if (Math.abs(dx) <= TAP_MAX && Math.abs(dy) <= TAP_MAX) {
        const now = Date.now();
        if (now - lastTap.current < 300) {
          lastTap.current = 0;
          onDropRef.current();
        } else {
          lastTap.current = now;
          moveToPoint(t.clientX);
        }
        return;
      }
      if (Math.abs(dx) < SWIPE_MIN && Math.abs(dy) < SWIPE_MIN) return;
      if (Math.abs(dx) > Math.abs(dy)) onMoveRef.current(dx < 0 ? -1 : 1);
      else if (dy > 0) onDropRef.current();
    };

    el.addEventListener("touchstart", start, { passive: true });
    el.addEventListener("touchmove", move, { passive: false });
    el.addEventListener("touchend", end, { passive: true });
    el.addEventListener("touchcancel", end, { passive: true });
    return () => {
      el.removeEventListener("touchstart", start);
      el.removeEventListener("touchmove", move);
      el.removeEventListener("touchend", end);
      el.removeEventListener("touchcancel", end);
    };
  }, [moveToPoint]);

  return (
    <div className="flex flex-col items-center gap-3">
    <div
      ref={rootRef}
      className="mx-auto w-full touch-none select-none overscroll-contain"
      style={{
        touchAction: "none",
        maxWidth: `min(100%, 28rem, calc((100dvh - 23rem) * ${cols} / ${rows}))`,
      }}
      role="application"
      aria-label="Игровое поле КабельТрис"
      onClick={(e) => {
        if (e.detail === 0) return;
        moveToPoint(e.clientX);
      }}
      onDoubleClick={onDrop}
    >
      <div
        ref={gridRef}
        className="grid gap-0.5 rounded-xl border border-border bg-muted/50 p-1 sm:gap-1 sm:p-1.5"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
          aspectRatio: `${cols} / ${rows}`,
        }}
      >
        {grid.map((row, r) =>
          row.map((cell, c) => {
            const isFalling = falling && falling.row === r && falling.col === c;
            const shown: GridCell = isFalling ? { kind: "brand", productId: falling.productId } : cell;
            const float = fx.find((item) => item.row === r && item.col === c);
            return (
              <div
                key={`${r}-${c}`}
                className={cn(
                  "relative min-h-0 min-w-0 overflow-hidden rounded-sm bg-background",
                  isFalling && "ring-2 ring-primary",
                )}
              >
                <CellView cell={shown} products={products} />
                {float ? (
                  <span className="pointer-events-none absolute inset-x-0 top-0 animate-pulse text-center text-[10px] font-bold text-primary motion-reduce:animate-none">
                    {float.text}
                  </span>
                ) : null}
              </div>
            );
          }),
        )}
      </div>
    </div>

      <div className="flex w-full max-w-xs items-center justify-center gap-2 sm:hidden">
        <Button
          type="button"
          variant="outline"
          className="h-12 flex-1"
          aria-label="Влево"
          onClick={() => onMove(-1)}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <Button type="button" className="h-12 flex-1" aria-label="Вниз" onClick={onDrop}>
          <ChevronDown className="h-5 w-5" />
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-12 flex-1"
          aria-label="Вправо"
          onClick={() => onMove(1)}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}

function CellView({ cell, products }: { cell: GridCell; products: CabletrisProduct[] }) {
  if (cell.kind === "empty") return null;
  if (cell.kind === "category") {
    return <CategoryTile label={categoryLabel(products, cell.categoryId)} />;
  }
  const product = productById(products, cell.productId);
  if (!product) return null;
  return <ProductCard brand={product.brand} image={product.image} thumb />;
}
