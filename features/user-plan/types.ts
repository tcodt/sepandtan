/** Aligned with swagger CurrentUserPlanEntity / UserPlanListItemEntity */

export type UserPlanStatus = "DRAFT" | "ACTIVE" | "COMPLETED" | "CANCELLED";
export type UserPlanType = "WORKOUT" | "DIET" | "ALL";
export type UserPlanSource = "COACH" | "SITE" | "AI";

export type UserPlanCoachRef = {
  id: string;
  name: string;
  slug?: string | null;
};

export type CurrentUserPlan = {
  id: string;
  title: string;
  status: UserPlanStatus;
  type: UserPlanType;
  source: UserPlanSource | null;
  startDate: string | null;
  endDate: string | null;
  activatedAt: string | null;
  coach: UserPlanCoachRef | null;
  hasWorkout: boolean;
  hasDiet: boolean;
  currentWeek: number | null;
  isStarted: boolean;
  isExpired: boolean;
};

export type UserPlanListItem = {
  id: string;
  title: string;
  status: UserPlanStatus;
  type: UserPlanType;
  source: UserPlanSource | null;
  startDate: string | null;
  endDate: string | null;
  activatedAt: string | null;
  coach: UserPlanCoachRef | null;
};

export type ActivateUserPlanInput = {
  startDate?: string;
  endDate?: string;
};
