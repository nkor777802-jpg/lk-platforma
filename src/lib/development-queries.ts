import { queryOptions } from "@tanstack/react-query";
import {
  developmentAnalytics,
  listDevelopmentPlans,
  myDevelopment,
} from "./development.functions";

export const myDevelopmentQuery = queryOptions({
  queryKey: ["development", "me"],
  queryFn: () => myDevelopment(),
});

export const developmentPlansQuery = queryOptions({
  queryKey: ["development", "plans"],
  queryFn: () => listDevelopmentPlans(),
});

export const developmentAnalyticsQuery = queryOptions({
  queryKey: ["development", "analytics"],
  queryFn: () => developmentAnalytics(),
});