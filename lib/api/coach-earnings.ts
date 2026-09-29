import type { CoachSale, CoachEarningsSummary } from "@/lib/types/access";
import {
  getSalesByCoach,
  getCoachEarningsSummary,
} from "@/lib/data/coach-earnings";

function delay(ms = 300): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getCoachSales(coachId: string): Promise<CoachSale[]> {
  await delay();
  return getSalesByCoach(coachId);
}

export async function getCoachEarningsSummaryById(
  coachId: string,
): Promise<CoachEarningsSummary | null> {
  await delay();
  return getCoachEarningsSummary(coachId);
}
