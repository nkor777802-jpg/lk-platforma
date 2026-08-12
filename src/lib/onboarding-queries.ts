import { queryOptions } from "@tanstack/react-query";
import {
  listOnboardingFeedback,
  listOnboardingPrograms,
  myCompetencyPassport,
  myOnboarding,
} from "./onboarding.functions";

export const myOnboardingQuery = queryOptions({
  queryKey: ["onboarding", "me"],
  queryFn: () => myOnboarding(),
});

export const myPassportQuery = queryOptions({
  queryKey: ["competency-passport", "me"],
  queryFn: () => myCompetencyPassport(),
});

export const onboardingProgramsQuery = queryOptions({
  queryKey: ["admin", "onboarding", "programs"],
  queryFn: () => listOnboardingPrograms(),
});

export const onboardingFeedbackQuery = queryOptions({
  queryKey: ["admin", "onboarding", "feedback"],
  queryFn: () => listOnboardingFeedback(),
});
