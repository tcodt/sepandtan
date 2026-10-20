"use client";

import { create } from "zustand";
import type { Plan, PlanDay } from "@/lib/types/plan";
import {
  getPlanById,
  getCurrentDayNumber,
  getDayFromPlan,
} from "@/lib/api/plans";

type PlanState = {
  plan: Plan | null;
  todayDay: PlanDay | null;
  currentDayNumber: number;
  isLoading: boolean;
  error: string | null;

  loadPlan: (planId: string) => Promise<void>;
  clearPlan: () => void;
  setPlan: (plan: Plan) => void;
};

export const usePlanStore = create<PlanState>((set) => ({
  plan: null,
  todayDay: null,
  currentDayNumber: 1,
  isLoading: false,
  error: null,

  loadPlan: async (planId: string) => {
    set({ isLoading: true, error: null });
    try {
      const plan = await getPlanById(planId);
      const dayNumber = getCurrentDayNumber(plan);
      const todayDay = getDayFromPlan(plan, dayNumber);
      set({
        plan,
        todayDay,
        currentDayNumber: dayNumber,
        isLoading: false,
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : "خطا در بارگذاری برنامه";
      set({
        error: message,
        isLoading: false,
        plan: null,
        todayDay: null,
      });
    }
  },

  clearPlan: () =>
    set({
      plan: null,
      todayDay: null,
      currentDayNumber: 1,
      error: null,
    }),

  setPlan: (plan: Plan) => {
    const dayNumber = getCurrentDayNumber(plan);
    const todayDay = getDayFromPlan(plan, dayNumber);
    set({
      plan,
      todayDay,
      currentDayNumber: dayNumber,
      isLoading: false,
      error: null,
    });
  },
}));
