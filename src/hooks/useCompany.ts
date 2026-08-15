import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { siteContactsQuery } from "@/lib/public-queries";
import { company as defaults } from "@/content/site";

export type CompanyContacts = typeof defaults;

/** Контакты предприятия из админ-панели с запасными значениями из кода. */
export function useCompany(): CompanyContacts {
  const { data } = useQuery(siteContactsQuery);
  // На сервере и при первой отрисовке на клиенте используем значения из кода,
  // чтобы разметка совпадала и не возникало ошибки гидратации.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  if (!hydrated || !data) return defaults;
  const merged: Record<string, string> = { ...defaults };
  for (const [k, v] of Object.entries(data)) {
    if (typeof v === "string" && v.trim()) merged[k] = v;
  }
  return merged as CompanyContacts;
}
