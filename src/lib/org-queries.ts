import { queryOptions } from "@tanstack/react-query";
import { getOrgStructure, getWorkCenterLinks, listOrgVersions } from "./org.functions";

export const orgStructureQuery = (versionId?: string | null, onDate?: string | null) =>
  queryOptions({
    queryKey: ["org", "structure", versionId ?? null, onDate ?? null],
    queryFn: () => getOrgStructure({ data: { versionId: versionId ?? null, onDate: onDate ?? null } }),
  });

export const orgVersionsQuery = () =>
  queryOptions({ queryKey: ["org", "versions"], queryFn: () => listOrgVersions() });

export const orgWorkCenterLinksQuery = () =>
  queryOptions({ queryKey: ["org", "work-center-links"], queryFn: () => getWorkCenterLinks() });