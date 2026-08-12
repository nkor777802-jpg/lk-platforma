/** Ключ флага разблокировки админ-панели в sessionStorage (живёт до закрытия вкладки). */
export function adminUnlockKey(userId: string): string {
  return `admin-panel-unlocked:${userId}`;
}

/** Сброс флага (при выходе из аккаунта). */
export function clearAdminUnlock(): void {
  if (typeof sessionStorage === "undefined") return;
  for (const key of Object.keys(sessionStorage)) {
    if (key.startsWith("admin-panel-unlocked:")) sessionStorage.removeItem(key);
  }
}