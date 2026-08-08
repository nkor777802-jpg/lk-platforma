import { queryOptions } from "@tanstack/react-query";
import { gamificationSettings, listLeaderboards, myGamification } from "./gamification.functions";

export const gamificationSettingsQuery = queryOptions({
  queryKey: ["gamification", "settings"],
  queryFn: () => gamificationSettings(),
});

export const myGamificationQuery = queryOptions({
  queryKey: ["gamification", "me"],
  queryFn: () => myGamification(),
});

export const leaderboardsQuery = queryOptions({
  queryKey: ["gamification", "leaderboards"],
  queryFn: () => listLeaderboards(),
});
