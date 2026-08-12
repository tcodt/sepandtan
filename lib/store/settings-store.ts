"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type WeightUnit = "kg" | "lb";
export type HeightUnit = "cm" | "ft";
export type Language = "fa" | "en";

type SettingsState = {
  notificationsEnabled: boolean;
  workoutReminders: boolean;
  mealReminders: boolean;
  weeklyReport: boolean;
  weightUnit: WeightUnit;
  heightUnit: HeightUnit;
  language: Language;
  reduceMotion: boolean;

  setNotificationsEnabled: (value: boolean) => void;
  setWorkoutReminders: (value: boolean) => void;
  setMealReminders: (value: boolean) => void;
  setWeeklyReport: (value: boolean) => void;
  setWeightUnit: (value: WeightUnit) => void;
  setHeightUnit: (value: HeightUnit) => void;
  setLanguage: (value: Language) => void;
  setReduceMotion: (value: boolean) => void;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      notificationsEnabled: true,
      workoutReminders: true,
      mealReminders: true,
      weeklyReport: false,
      weightUnit: "kg",
      heightUnit: "cm",
      language: "fa",
      reduceMotion: false,

      setNotificationsEnabled: (value) => set({ notificationsEnabled: value }),
      setWorkoutReminders: (value) => set({ workoutReminders: value }),
      setMealReminders: (value) => set({ mealReminders: value }),
      setWeeklyReport: (value) => set({ weeklyReport: value }),
      setWeightUnit: (value) => set({ weightUnit: value }),
      setHeightUnit: (value) => set({ heightUnit: value }),
      setLanguage: (value) => set({ language: value }),
      setReduceMotion: (value) => set({ reduceMotion: value }),
    }),
    {
      name: "sepandtan-settings",
    },
  ),
);
