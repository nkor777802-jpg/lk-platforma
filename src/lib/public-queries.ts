import { queryOptions } from "@tanstack/react-query";
import { getSiteContacts, listPublicProfessions } from "./public.functions";

export const publicProfessionsQuery = queryOptions({
  queryKey: ["public", "professions"],
  queryFn: () => listPublicProfessions(),
  staleTime: 5 * 60 * 1000,
});

export const siteContactsQuery = queryOptions({
  queryKey: ["public", "site-contacts"],
  queryFn: () => getSiteContacts(),
  staleTime: 5 * 60 * 1000,
});
