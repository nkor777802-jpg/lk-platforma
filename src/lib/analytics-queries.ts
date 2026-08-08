import { queryOptions } from "@tanstack/react-query";
import {
  analyticsDashboard,
  analyticsFilterOptions,
  myAnalytics,
  type AnalyticsInput,
} from "./analytics.functions";

export const analyticsFiltersQuery = queryOptions({
  queryKey: ["analytics", "filters"],
  queryFn: () => analyticsFilterOptions(),
});

export function analyticsDashboardQuery(input: AnalyticsInput) {
  return queryOptions({
    queryKey: ["analytics", "dashboard", input],
    queryFn: () => analyticsDashboard({ data: input }),
  });
}

export const myAnalyticsQuery = queryOptions({
  queryKey: ["analytics", "me"],
  queryFn: () => myAnalytics(),
});