import { queryOptions } from "@tanstack/react-query";
import { listPublicProfessions } from "./public.functions";

export const publicProfessionsQuery = queryOptions({
  queryKey: ["public", "professions"],
  queryFn: () => listPublicProfessions(),
  staleTime: 5 * 60 * 1000,
});
