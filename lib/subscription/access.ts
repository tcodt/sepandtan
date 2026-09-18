import type {
  SubscriptionPlan,
  SubscriptionStatus,
  UserProfile,
} from "@/lib/types/plan";

export const FREE_TRIAL_DAYS = 7;

export function subscriptionStatusFromPlan(
  plan: Pick<SubscriptionPlan, "id">,
): SubscriptionStatus {
  switch (plan.id) {
    case "basic":
      return "basic";
    case "pro":
      return "pro";
    case "premium":
      return "premium";
    default:
      // پلن ناشناخته → امن‌ترین حالت پولی پایه
      return "basic";
  }
}

export function getSubscriptionLabel(
  status: SubscriptionStatus | string | undefined | null,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _currentPlanId?: string | null,
): string {
  switch (status) {
    case "basic":
      return "پایه";
    case "pro":
      return "حرفه‌ای";
    case "premium":
      return "پریمیوم";
    case "coach":
    case "coach_plan":
      return "برنامه مربی";
    case "free":
    default:
      return "رایگان";
  }
}

export function isPaidSubscription(
  user: UserProfile | null | undefined,
): boolean {
  if (!user?.subscriptionStatus) return false;
  return user.subscriptionStatus !== "free";
}

export function getFreeTrialDaysLeft(
  user: UserProfile | null | undefined,
): number | null {
  if (!user || user.subscriptionStatus !== "free") return null;
  const start = new Date(user.createdAt);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + FREE_TRIAL_DAYS);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function isFreeTrialExpired(
  user: UserProfile | null | undefined,
): boolean {
  const left = getFreeTrialDaysLeft(user);
  return left !== null && left <= 0;
}

export function canSwitchPlan(user: UserProfile | null | undefined): boolean {
  if (!user) return false;
  return user.subscriptionStatus !== "free";
}
