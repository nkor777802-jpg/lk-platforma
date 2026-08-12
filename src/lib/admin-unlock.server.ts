import { createHash, timingSafeEqual } from "node:crypto";

/** Сравнение строк постоянного времени (через хеши равной длины). */
export function timingSafeEqualString(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a, "utf8").digest();
  const hb = createHash("sha256").update(b, "utf8").digest();
  return timingSafeEqual(ha, hb);
}