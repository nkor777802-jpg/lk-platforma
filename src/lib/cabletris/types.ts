export type ProductRarity = "common" | "uncommon" | "rare";

export type CabletrisProduct = {
  product_id: string;
  brand: string;
  category_id: string;
  category: string;
  display_category: string;
  image: string;
  difficulty: number;
  rarity: ProductRarity;
  is_active: boolean;
};

export type CabletrisOrder = {
  type: "brand";
  productId: string;
  target: number;
};

export type CabletrisConfig = {
  gameId: string;
  title: string;
  matchCount: number;
  grid: { columns: number; rows: number };
  timing: { initialFallMs: number; minFallMs: number; speedUpEverySec: number };
  scoring: {
    brandMerge: number;
    categoryMerge: number;
    orderComplete: number;
    comboStepBonus: number;
  };
  mvpOrder: CabletrisOrder;
  controls: { desktop: string[]; mobile: string[] };
};

export type GridCell =
  | { kind: "empty" }
  | { kind: "brand"; productId: string }
  | { kind: "category"; categoryId: string };

export type FallingPiece = {
  productId: string;
  row: number;
  col: number;
};

export type GamePhase = "idle" | "countdown" | "playing" | "paused" | "gameover";

export type MergeFx = {
  id: number;
  row: number;
  col: number;
  text: string;
};

export type GameStats = {
  score: number;
  combo: number;
  bestCombo: number;
  brandMerges: number;
  categoryMerges: number;
  orderProgress: number;
  orderCompleted: boolean;
};

export type CabletrisEventName =
  | "game_started"
  | "brand_merged"
  | "category_merged"
  | "order_completed"
  | "game_finished";
