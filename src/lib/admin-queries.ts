import { queryOptions } from "@tanstack/react-query";
import {
  adminOverview,
  countNewContactRequests,
  getPlatformSettings,
  listAdminUsers,
  listAuditLog,
  listContactRequests,
  listRows,
} from "./admin.functions";


export const adminOverviewQuery = queryOptions({
  queryKey: ["admin", "overview"],
  queryFn: () => adminOverview(),
});

export const adminUsersQuery = queryOptions({
  queryKey: ["admin", "users"],
  queryFn: () => listAdminUsers(),
});

export const adminAuditQuery = queryOptions({
  queryKey: ["admin", "audit"],
  queryFn: () => listAuditLog(),
});

export const adminSettingsQuery = queryOptions({
  queryKey: ["admin", "settings"],
  queryFn: () => getPlatformSettings(),
});

export function adminTableQuery(table: string, select?: string, orderBy?: string) {
  return queryOptions({
    queryKey: ["admin", "table", table, select ?? "*", orderBy ?? ""],
    queryFn: () => listRows({ data: { table, select, orderBy } }),
  });
}
