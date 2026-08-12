import { create } from "zustand";
import { persist } from "zustand/middleware";

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
  lastName: string;
  email?: string;
  phone?: string;
  bodyInfo?: BodyInfo;
  equipment?: Equipment;
  goal?: Goal;
  onboardingCompleted: boolean;
  createdAt: string;
};

type UserState = {
  user: UserProfile | null;
  isAuthenticated: boolean;
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

      setUser: (user) => set({ user, isAuthenticated: true }),

      updateProfile: (data) => {
        const current = get().user;
        if (!current) return;
        set({ user: { ...current, ...data } });
      },

      logout: () => set({ user: null, isAuthenticated: false }),

      completeOnboarding: (data) => {
        const current = get().user;
        if (!current) return;
        set({
          user: {
            ...current,
            ...data,
            onboardingCompleted: true,
          },
        });
      },
    }),
    {
      name: "sepandtan-user",
    },
  ),
);
