import { useQuery } from "@tanstack/react-query";
import { siteContactsQuery } from "@/lib/public-queries";
import { company as defaults } from "@/content/site";

export type CompanyContacts = typeof defaults;

/** Контакты предприятия из админ-панели с запасными значениями из кода. */
export function useCompany(): CompanyContacts {
  const { data } = useQuery(siteContactsQuery);
  if (!data) return defaults;
  const merged: Record<string, string> = { ...defaults };
  for (const [k, v] of Object.entries(data)) {
    if (typeof v === "string" && v.trim()) merged[k] = v;
  }
  return merged as CompanyContacts;
}
