import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { loadCabletrisConfig, loadCabletrisProducts, productById } from "@/lib/cabletris/adapter";
import { emitCabletrisEvent } from "@/lib/cabletris/events";
import {
  createInitialState,
  fallInterval,
  softDrop,
  spawnFalling,
  tickFall,
  tryMove,
  type EngineState,
  type ResolveMeta,
} from "@/lib/cabletris/engine";
import type { MergeFx } from "@/lib/cabletris/types";

const COUNTDOWN_MS = 1000;

export function useCabletris() {
  const config = useMemo(() => loadCabletrisConfig(), []);
  const products = useMemo(() => loadCabletrisProducts(), []);
  const rng = useCallback(() => Math.random(), []);

  const [state, setState] = useState<EngineState>(() => createInitialState(config, products, rng));
  const [countdown, setCountdown] = useState<number | null>(null);
  const [soundOn, setSoundOn] = useState(false);
  const [fx, setFx] = useState<MergeFx[]>([]);
  const fxId = useRef(0);
  const stateRef = useRef(state);
  const playStarted = useRef(0);
  const fallAcc = useRef(0);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const orderProduct = productById(products, config.mvpOrder.productId);

  const pushFx = useCallback((meta: ResolveMeta) => {
    const items: MergeFx[] = [];
    for (const m of meta.brandMerges) {
      fxId.current += 1;
      items.push({ id: fxId.current, row: m.at.row, col: m.at.col, text: `+${config.scoring.brandMerge}` });
    }
    for (const m of meta.categoryMerges) {
      fxId.current += 1;
      items.push({
        id: fxId.current,
        row: m.at.row,
        col: m.at.col,
        text: `+${config.scoring.categoryMerge}`,
      });
    }
    if (items.length === 0) return;
    setFx((prev) => [...prev, ...items]);
    window.setTimeout(() => {
      setFx((prev) => prev.filter((x) => !items.some((i) => i.id === x.id)));
    }, 700);
  }, [config.scoring.brandMerge, config.scoring.categoryMerge]);

  const emitFromMeta = useCallback((meta: ResolveMeta, next: EngineState) => {
    for (const m of meta.brandMerges) {
      emitCabletrisEvent("brand_merged", { productId: m.productId, categoryId: m.categoryId });
    }
    for (const m of meta.categoryMerges) {
      emitCabletrisEvent("category_merged", { categoryId: m.categoryId });
    }
    if (meta.orderJustCompleted) emitCabletrisEvent("order_completed", { productId: config.mvpOrder.productId });
    if (next.phase === "gameover") {
      emitCabletrisEvent("game_finished", {
        score: next.score,
        brandMerges: next.brandMerges,
        categoryMerges: next.categoryMerges,
        bestCombo: next.bestCombo,
        orderCompleted: next.orderCompleted,
      });
    }
  }, [config.mvpOrder.productId]);

  const afterLock = useCallback(
    (locked: EngineState, meta: ResolveMeta) => {
      pushFx(meta);
      const spawned = spawnFalling(locked, products, rng);
      emitFromMeta(meta, spawned);
      return spawned;
    },
    [emitFromMeta, products, pushFx, rng],
  );

  const start = useCallback(() => {
    const fresh = createInitialState(config, products, rng);
    setState({ ...fresh, phase: "countdown" });
    setCountdown(3);
    setFx([]);
    emitCabletrisEvent("game_started", { gameId: config.gameId });
  }, [config, products, rng]);

  const restart = useCallback(() => {
    start();
  }, [start]);

  useEffect(() => {
    if (state.phase !== "countdown" || countdown === null) return;
    const t = window.setTimeout(() => {
      if (countdown <= 1) {
        setCountdown(null);
        setState((prev) => spawnFalling({ ...prev, phase: "playing" }, products, rng));
        playStarted.current = performance.now();
        fallAcc.current = 0;
        return;
      }
      setCountdown((c) => (c === null ? null : c - 1));
    }, COUNTDOWN_MS);
    return () => window.clearTimeout(t);
  }, [countdown, products, rng, state.phase]);

  const pause = useCallback(() => {
    setState((prev) => (prev.phase === "playing" ? { ...prev, phase: "paused" } : prev));
  }, []);

  const resume = useCallback(() => {
    setState((prev) => (prev.phase === "paused" ? { ...prev, phase: "playing" } : prev));
    fallAcc.current = 0;
  }, []);

  useEffect(() => {
    if (state.phase !== "playing") return;
    let frame = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = now - last;
      last = now;
      const cur = stateRef.current;
      if (cur.phase !== "playing") {
        frame = requestAnimationFrame(loop);
        return;
      }
      const elapsed = now - playStarted.current;
      fallAcc.current += dt;
      const interval = fallInterval(config, elapsed);
      if (fallAcc.current >= interval) {
        fallAcc.current = 0;
        const stepped = tickFall({ ...cur, elapsedMs: elapsed }, config, products);
        if (stepped.locked && stepped.meta) {
          setState(afterLock(stepped.state, stepped.meta));
        } else {
          setState({ ...stepped.state, elapsedMs: elapsed });
        }
      } else if (Math.abs(elapsed - cur.elapsedMs) > 250) {
        setState((p) => ({ ...p, elapsedMs: elapsed }));
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [afterLock, config, products, state.phase]);

  const move = useCallback((dCol: number) => {
    setState((prev) => tryMove(prev, dCol, 0));
  }, []);

  const drop = useCallback(() => {
    const prev = stateRef.current;
    if (prev.phase !== "playing") return;
    const stepped = softDrop(prev, config, products);
    if (stepped.locked && stepped.meta) {
      setState(afterLock(stepped.state, stepped.meta));
      return;
    }
    setState(stepped.state);
  }, [afterLock, config, products]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const cur = stateRef.current;
      if (cur.phase === "paused" && e.key === "Escape") {
        e.preventDefault();
        resume();
        return;
      }
      if (cur.phase !== "playing") return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        move(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        move(1);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        drop();
      } else if (e.key === "Escape") {
        e.preventDefault();
        pause();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drop, move, pause, resume]);

  return {
    config,
    products,
    orderProduct,
    state,
    countdown,
    soundOn,
    setSoundOn,
    fx,
    start,
    restart,
    pause,
    resume,
    move,
    drop,
  };
}
