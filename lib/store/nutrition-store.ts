"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  todayMealPlan,
  dailyCalorieTarget,
  type MealItem,
  type MealType,
} from "@/lib/data/nutrition";

export type MealLog = {
  type: MealType;
  selectedMealId: string;
  eaten: boolean;
};

type NutritionState = {
  date: string;
  targetCalories: number;
  meals: MealLog[];

  initToday: () => void;
  markEaten: (type: MealType, eaten: boolean) => void;
  replaceMeal: (type: MealType, mealId: string) => void;
  getSelectedMeal: (type: MealType) => MealItem | undefined;
  consumedCalories: () => number;
  eatenCount: () => number;
  totalMeals: () => number;
};

function todayKey() {
  return new Date().toISOString().split("T")[0];
}

function buildDefaultMeals(): MealLog[] {
  return todayMealPlan.map((slot) => ({
    type: slot.type,
    selectedMealId: slot.alternatives[0].id,
    eaten: false,
  }));
}

export const useNutritionStore = create<NutritionState>()(
  persist(
    (set, get) => ({
      date: todayKey(),
      targetCalories: dailyCalorieTarget,
      meals: buildDefaultMeals(),

      initToday: () => {
        const current = get().date;
        const today = todayKey();
        if (current !== today) {
          set({
            date: today,
            meals: buildDefaultMeals(),
            targetCalories: dailyCalorieTarget,
          });
        }
      },

      markEaten: (type, eaten) => {
        set({
          meals: get().meals.map((m) =>
            m.type === type ? { ...m, eaten } : m,
          ),
        });
      },

      replaceMeal: (type, mealId) => {
        set({
          meals: get().meals.map((m) =>
            m.type === type
              ? { ...m, selectedMealId: mealId, eaten: false }
              : m,
          ),
        });
      },

      getSelectedMeal: (type) => {
        const log = get().meals.find((m) => m.type === type);
        if (!log) return undefined;
        const slot = todayMealPlan.find((s) => s.type === type);
        return slot?.alternatives.find((a) => a.id === log.selectedMealId);
      },

      consumedCalories: () => {
        const { meals, getSelectedMeal } = get();
        return meals.reduce((sum, m) => {
          if (!m.eaten) return sum;
          const meal = getSelectedMeal(m.type);
          return sum + (meal?.calories ?? 0);
        }, 0);
      },

      eatenCount: () => get().meals.filter((m) => m.eaten).length,
      totalMeals: () => get().meals.length,
    }),
    {
      name: "sepandtan-nutrition",
    },
  ),
);
