"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type BodyInfo = {
  gender: "male" | "female";
  age: number;
  height: number;
  weight: number;
  activityLevel: "sedentary" | "light" | "moderate" | "active" | "very_active";
};

export type Equipment = "home" | "gym" | "both";

export type Goal =
  | "lose_weight"
  | "build_muscle"
  | "maintain"
  | "endurance"
  | "general_fitness";

export type UserProfile = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  avatarUrl?: string; // data URL یا لینک سرور
  bodyInfo?: BodyInfo;
  equipment?: Equipment;
  goal?: Goal;
  onboardingCompleted: boolean;
  createdAt: string;
};

type UserState = {
  user: UserProfile | null;
  isAuthenticated: boolean;
  _hasHydrated: boolean;

  setHasHydrated: (value: boolean) => void;
  setUser: (user: UserProfile) => void;
  updateProfile: (data: Partial<UserProfile>) => void;
  logout: () => void;
  completeOnboarding: (data: {
    bodyInfo: BodyInfo;
    equipment: Equipment;
    goal: Goal;
  }) => void;
};

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      _hasHydrated: false,

      setHasHydrated: (value) => set({ _hasHydrated: value }),

      setUser: (user) =>
        set({
          user,
          isAuthenticated: true,
        }),

      updateProfile: (data) => {
        const current = get().user;
        if (!current) return;
        set({ user: { ...current, ...data } });
      },

      logout: () =>
        set({
          user: null,
          isAuthenticated: false,
        }),

      completeOnboarding: (data) => {
        const current = get().user;
        if (!current) return;

        set({
          user: {
            ...current,
            bodyInfo: data.bodyInfo,
            equipment: data.equipment,
            goal: data.goal,
            onboardingCompleted: true,
          },
        });
      },
    }),
    {
      name: "sepandtan-user",
      storage: createJSONStorage(() => localStorage),
      // فقط این فیلدها ذخیره شوند
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

/** هوک کمکی: صبر تا hydrate تمام شود */
export function useAuthReady() {
  const hasHydrated = useUserStore((s) => s._hasHydrated);
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);
  const user = useUserStore((s) => s.user);

  return {
    ready: hasHydrated,
    isAuthenticated,
    user,
  };
}
