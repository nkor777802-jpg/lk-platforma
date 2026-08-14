import { queryOptions } from "@tanstack/react-query";
import {
  getPublicOrgStructure,
  getSiteContacts,
  listPublicManagement,
  listPublicProfessions,
} from "./public.functions";

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

export const publicManagementQuery = queryOptions({
  queryKey: ["public", "management"],
  queryFn: () => listPublicManagement(),
  staleTime: 5 * 60 * 1000,
});

export const publicOrgStructureQuery = queryOptions({
  queryKey: ["public", "org-structure"],
  queryFn: () => getPublicOrgStructure(),
  staleTime: 10 * 60 * 1000,
});
