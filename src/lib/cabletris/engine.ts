import type {
  CabletrisConfig,
  CabletrisProduct,
  FallingPiece,
  GamePhase,
  GameStats,
  GridCell,
} from "./types";

export type EngineState = GameStats & {
  grid: GridCell[][];
  falling: FallingPiece | null;
  nextProductId: string;
  recentSpawns: string[];
  phase: GamePhase;
  elapsedMs: number;
  lastWaveCombo: number;
};

const DIRS: ReadonlyArray<readonly [number, number]> = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

export function emptyGrid(rows: number, cols: number): GridCell[][] {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ kind: "empty" }) as GridCell),
  );
}

export function cloneGrid(grid: GridCell[][]): GridCell[][] {
  return grid.map((row) => row.map((cell) => ({ ...cell })));
}

export function fallInterval(config: CabletrisConfig, elapsedMs: number): number {
  const { initialFallMs, minFallMs, speedUpEverySec } = config.timing;
  const steps = Math.floor(elapsedMs / (speedUpEverySec * 1000));
  return Math.max(minFallMs, initialFallMs - steps * 150);
}

function cellAt(grid: GridCell[][], row: number, col: number): GridCell | undefined {
  return grid[row]?.[col];
}

function isEmpty(grid: GridCell[][], row: number, col: number): boolean {
  return cellAt(grid, row, col)?.kind === "empty";
}

function inBounds(grid: GridCell[][], row: number, col: number): boolean {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  return row >= 0 && col >= 0 && row < rows && col < cols;
}

export function canOccupy(grid: GridCell[][], row: number, col: number): boolean {
  return inBounds(grid, row, col) && isEmpty(grid, row, col);
}

function pickProductId(
  products: CabletrisProduct[],
  recent: string[],
  rng: () => number,
): string {
  const ids = products.map((p) => p.product_id);
  const first = ids[0];
  if (!first) return "";
  if (ids.length === 1) return first;

  let pick = ids[Math.floor(rng() * ids.length)] ?? first;
  const a = recent[recent.length - 1];
  const b = recent[recent.length - 2];
  if (a && a === b && pick === a) {
    const others = ids.filter((id) => id !== pick);
    pick = others[Math.floor(rng() * others.length)] ?? pick;
  }
  return pick;
}

const SPAWN_COL_ORDER = [2, 3, 1, 4, 0, 5];

function spawnCol(grid: GridCell[][], rng: () => number): number | null {
  const cols = grid[0]?.length ?? 0;
  const free = SPAWN_COL_ORDER.filter((c) => c < cols && isEmpty(grid, 0, c));
  if (free.length === 0) return null;
  const shuffled = [...free].sort(() => rng() - 0.5);
  return shuffled[0] ?? null;
}

export function createInitialState(
  config: CabletrisConfig,
  products: CabletrisProduct[],
  rng: () => number,
): EngineState {
  const grid = emptyGrid(config.grid.rows, config.grid.columns);
  const first = pickProductId(products, [], rng);
  return {
    grid,
    falling: null,
    nextProductId: first,
    recentSpawns: [],
    phase: "idle",
    elapsedMs: 0,
    lastWaveCombo: 1,
    score: 0,
    combo: 1,
    bestCombo: 1,
    brandMerges: 0,
    categoryMerges: 0,
    orderProgress: 0,
    orderCompleted: false,
  };
}

export function spawnFalling(
  state: EngineState,
  products: CabletrisProduct[],
  rng: () => number,
): EngineState {
  const productId = state.nextProductId;
  if (!productId) {
    return { ...state, phase: "gameover", falling: null };
  }
  const col = spawnCol(state.grid, rng);
  if (col === null) {
    return { ...state, phase: "gameover", falling: null };
  }
  const recent = [...state.recentSpawns, productId];
  const next = pickProductId(products, recent, rng);
  return {
    ...state,
    falling: { productId, row: 0, col },
    nextProductId: next,
    recentSpawns: recent.slice(-8),
    phase: "playing",
    combo: 1,
  };
}

export function tryMove(state: EngineState, dCol: number, dRow: number): EngineState {
  const piece = state.falling;
  if (!piece || state.phase !== "playing") return state;
  const row = piece.row + dRow;
  const col = piece.col + dCol;
  if (!canOccupy(state.grid, row, col)) return state;
  return { ...state, falling: { ...piece, row, col } };
}

function applyGravity(grid: GridCell[][]): GridCell[][] {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const next = emptyGrid(rows, cols);
  for (let c = 0; c < cols; c += 1) {
    const stack: GridCell[] = [];
    for (let r = 0; r < rows; r += 1) {
      const cell = grid[r]?.[c];
      if (cell && cell.kind !== "empty") stack.push(cell);
    }
    let r = rows - 1;
    for (let i = stack.length - 1; i >= 0; i -= 1) {
      const cell = stack[i];
      if (cell) next[r]![c] = cell;
      r -= 1;
    }
  }
  return next;
}

type Coord = { row: number; col: number };

function flood(
  grid: GridCell[][],
  start: Coord,
  match: (cell: GridCell) => boolean,
): Coord[] {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const key = (r: number, c: number) => `${r}:${c}`;
  const seen = new Set<string>([key(start.row, start.col)]);
  const out: Coord[] = [start];
  const q = [start];
  while (q.length) {
    const cur = q.pop();
    if (!cur) break;
    for (const [dr, dc] of DIRS) {
      const row = cur.row + dr;
      const col = cur.col + dc;
      if (row < 0 || col < 0 || row >= rows || col >= cols) continue;
      const k = key(row, col);
      if (seen.has(k)) continue;
      const cell = grid[row]?.[col];
      if (!cell || !match(cell)) continue;
      seen.add(k);
      const next = { row, col };
      out.push(next);
      q.push(next);
    }
  }
  return out;
}

function sortConsume(cells: Coord[]): Coord[] {
  return [...cells].sort((a, b) => b.row - a.row || a.col - b.col);
}

function findBrandGroups(grid: GridCell[][], matchCount: number): Coord[][] {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const seen = new Set<string>();
  const groups: Coord[][] = [];
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const cell = grid[r]?.[c];
      if (!cell || cell.kind !== "brand") continue;
      const k = `${r}:${c}`;
      if (seen.has(k)) continue;
      const productId = cell.productId;
      const group = flood(grid, { row: r, col: c }, (x) => x.kind === "brand" && x.productId === productId);
      for (const p of group) seen.add(`${p.row}:${p.col}`);
      if (group.length >= matchCount) groups.push(sortConsume(group).slice(0, matchCount));
    }
  }
  return groups;
}

function findCategoryGroups(grid: GridCell[][], matchCount: number): Coord[][] {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const seen = new Set<string>();
  const groups: Coord[][] = [];
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const cell = grid[r]?.[c];
      if (!cell || cell.kind !== "category") continue;
      const k = `${r}:${c}`;
      if (seen.has(k)) continue;
      const categoryId = cell.categoryId;
      const group = flood(
        grid,
        { row: r, col: c },
        (x) => x.kind === "category" && x.categoryId === categoryId,
      );
      for (const p of group) seen.add(`${p.row}:${p.col}`);
      if (group.length >= matchCount) groups.push(sortConsume(group).slice(0, matchCount));
    }
  }
  return groups;
}

export type ResolveMeta = {
  brandMerges: { productId: string; categoryId: string; at: Coord }[];
  categoryMerges: { categoryId: string; at: Coord }[];
  combo: number;
  orderJustCompleted: boolean;
  scoreDelta: number;
};

export function resolveBoard(
  state: EngineState,
  config: CabletrisConfig,
  products: CabletrisProduct[],
): { state: EngineState; meta: ResolveMeta } {
  const catalog = new Map(products.map((p) => [p.product_id, p]));
  let grid = applyGravity(cloneGrid(state.grid));
  let score = state.score;
  let brandMerges = state.brandMerges;
  let categoryMerges = state.categoryMerges;
  let orderProgress = state.orderProgress;
  let orderCompleted = state.orderCompleted;
  let bestCombo = state.bestCombo;
  let wave = 0;
  const meta: ResolveMeta = {
    brandMerges: [],
    categoryMerges: [],
    combo: 1,
    orderJustCompleted: false,
    scoreDelta: 0,
  };

  while (true) {
    const brands = findBrandGroups(grid, config.matchCount);
    const cats = findCategoryGroups(grid, config.matchCount);
    if (brands.length === 0 && cats.length === 0) break;
    wave += 1;
    const combo = wave;
    bestCombo = Math.max(bestCombo, combo);

    const consumed = new Set<string>();
    const mark = (p: Coord) => consumed.add(`${p.row}:${p.col}`);
    const taken = (p: Coord) => consumed.has(`${p.row}:${p.col}`);

    for (const group of brands) {
      const cells = group.filter((p) => !taken(p));
      if (cells.length < config.matchCount) continue;
      const target = cells[0];
      const sample = target ? grid[target.row]?.[target.col] : undefined;
      if (!target || !sample || sample.kind !== "brand") continue;
      const product = catalog.get(sample.productId);
      if (!product) continue;
      for (const p of cells) {
        mark(p);
        const row = grid[p.row];
        if (row) row[p.col] = { kind: "empty" };
      }
      const tRow = grid[target.row];
      if (tRow) tRow[target.col] = { kind: "category", categoryId: product.category_id };
      brandMerges += 1;
      let gained = config.scoring.brandMerge * combo;
      if (combo > 1) gained += config.scoring.comboStepBonus * (combo - 1);
      score += gained;
      meta.scoreDelta += gained;
      meta.brandMerges.push({
        productId: product.product_id,
        categoryId: product.category_id,
        at: target,
      });
      if (config.mvpOrder.type === "brand" && product.product_id === config.mvpOrder.productId) {
        orderProgress = Math.min(config.mvpOrder.target, orderProgress + config.matchCount);
        if (!orderCompleted && orderProgress >= config.mvpOrder.target) {
          orderCompleted = true;
          score += config.scoring.orderComplete;
          meta.scoreDelta += config.scoring.orderComplete;
          meta.orderJustCompleted = true;
        }
      }
    }

    for (const group of cats) {
      const cells = group.filter((p) => !taken(p));
      if (cells.length < config.matchCount) continue;
      const target = cells[0];
      const sample = target ? grid[target.row]?.[target.col] : undefined;
      if (!target || !sample || sample.kind !== "category") continue;
      for (const p of cells) {
        mark(p);
        const row = grid[p.row];
        if (row) row[p.col] = { kind: "empty" };
      }
      categoryMerges += 1;
      let gained = config.scoring.categoryMerge * combo;
      if (combo > 1) gained += config.scoring.comboStepBonus * (combo - 1);
      score += gained;
      meta.scoreDelta += gained;
      meta.categoryMerges.push({ categoryId: sample.categoryId, at: target });
    }

    grid = applyGravity(grid);
  }

  meta.combo = Math.max(1, wave);
  return {
    state: {
      ...state,
      grid,
      score,
      brandMerges,
      categoryMerges,
      orderProgress,
      orderCompleted,
      bestCombo,
      lastWaveCombo: meta.combo,
      combo: meta.combo,
      falling: null,
    },
    meta,
  };
}

export function lockPiece(
  state: EngineState,
  config: CabletrisConfig,
  products: CabletrisProduct[],
): { state: EngineState; meta: ResolveMeta } {
  const piece = state.falling;
  if (!piece) {
    return {
      state,
      meta: { brandMerges: [], categoryMerges: [], combo: 1, orderJustCompleted: false, scoreDelta: 0 },
    };
  }
  const grid = cloneGrid(state.grid);
  const row = grid[piece.row];
  if (row) row[piece.col] = { kind: "brand", productId: piece.productId };
  return resolveBoard({ ...state, grid, falling: null }, config, products);
}

export function tickFall(
  state: EngineState,
  config: CabletrisConfig,
  products: CabletrisProduct[],
): { state: EngineState; locked: boolean; meta: ResolveMeta | null } {
  const piece = state.falling;
  if (!piece || state.phase !== "playing") {
    return { state, locked: false, meta: null };
  }
  const nextRow = piece.row + 1;
  if (canOccupy(state.grid, nextRow, piece.col)) {
    return { state: { ...state, falling: { ...piece, row: nextRow } }, locked: false, meta: null };
  }
  const locked = lockPiece(state, config, products);
  return { state: locked.state, locked: true, meta: locked.meta };
}

export function softDrop(
  state: EngineState,
  config: CabletrisConfig,
  products: CabletrisProduct[],
): { state: EngineState; locked: boolean; meta: ResolveMeta | null } {
  return tickFall(state, config, products);
}
