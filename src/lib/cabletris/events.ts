import type { CabletrisEventName } from "./types";

/** Локальные события MVP без бэкенда и без новой схемы. */
export function emitCabletrisEvent(
  name: CabletrisEventName,
  payload: Record<string, unknown> = {},
) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("cabletris", { detail: { name, ...payload } }));
}
