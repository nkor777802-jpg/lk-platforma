import { queryOptions } from "@tanstack/react-query";
import { mySimulatorHistory, simulatorCatalog } from "./simulator.functions";

export const simulatorCatalogQuery = queryOptions({
  queryKey: ["simulator", "catalog"],
  queryFn: () => simulatorCatalog(),
});

export const simulatorHistoryQuery = queryOptions({
  queryKey: ["simulator", "history"],
  queryFn: () => mySimulatorHistory(),
});
