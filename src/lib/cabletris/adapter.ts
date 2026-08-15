import productsJson from "@/data/cabletris/data_products.json";
import configJson from "@/data/cabletris/game_config.json";
import type { CabletrisConfig, CabletrisProduct } from "./types";

function photoPrefixUrl(imagePath: string): string {
  const filename = imagePath.split(/[/\\]/).pop() ?? imagePath;
  const prefix = filename.match(/^(\d{2}-\d{3}_PHOTO_\d+)/)?.[1];
  if (prefix) return `/cabletris/products/${prefix}.png`;
  return `/cabletris/products/${encodeURIComponent(filename)}`;
}

function asProduct(row: (typeof productsJson)[number]): CabletrisProduct {
  return {
    product_id: row.product_id,
    brand: row.brand,
    category_id: row.category_id,
    category: row.category,
    display_category: row.display_category,
    image: photoPrefixUrl(row.image),
    difficulty: row.difficulty,
    rarity: row.rarity as CabletrisProduct["rarity"],
    is_active: row.is_active,
  };
}

/** Нормализованный каталог MVP. Позже источник можно заменить на API без смены движка. */
export function loadCabletrisProducts(): CabletrisProduct[] {
  return productsJson.map(asProduct).filter((p) => p.is_active);
}

export function loadCabletrisConfig(): CabletrisConfig {
  const cfg = configJson;
  return {
    gameId: cfg.gameId,
    title: cfg.title,
    matchCount: cfg.matchCount,
    grid: { columns: cfg.grid.columns, rows: cfg.grid.rows },
    timing: {
      initialFallMs: cfg.timing.initialFallMs,
      minFallMs: cfg.timing.minFallMs,
      speedUpEverySec: cfg.timing.speedUpEverySec,
    },
    scoring: { ...cfg.scoring },
    mvpOrder: {
      type: "brand",
      productId: cfg.mvpOrder.productId,
      target: cfg.mvpOrder.target,
    },
    controls: {
      desktop: [...cfg.controls.desktop],
      mobile: [...cfg.controls.mobile],
    },
  };
}

export function productById(
  products: CabletrisProduct[],
  productId: string,
): CabletrisProduct | undefined {
  return products.find((p) => p.product_id === productId);
}

export function categoryLabel(products: CabletrisProduct[], categoryId: string): string {
  const hit = products.find((p) => p.category_id === categoryId);
  return hit?.display_category ?? hit?.category ?? categoryId;
}
