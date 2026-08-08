import { queryOptions } from "@tanstack/react-query";
import {
  gamificationSettings,
  listLeaderboards,
  listTrainers,
  myGamification,
} from "./gamification.functions";

export const gamificationSettingsQuery = queryOptions({
  queryKey: ["gamification", "settings"],
  queryFn: () => gamificationSettings(),
});

export const myGamificationQuery = queryOptions({
  queryKey: ["gamification", "me"],
  queryFn: () => myGamification(),
});

export const trainersQuery = queryOptions({
  queryKey: ["gamification", "trainers"],
  queryFn: () => listTrainers(),
});

export const leaderboardsQuery = queryOptions({
  queryKey: ["gamification", "leaderboards"],
  queryFn: () => listLeaderboards(),
});