"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

import { GeneratingState } from "./generating-state";
import { BodyStep } from "./steps/body-step";
import { EquipmentStep } from "./steps/equipment-step";
import { GoalStep } from "./steps/goal-step";
import { ProgressHeader } from "./progress-header";
import {
  useUserStore,
  type BodyInfo,
  type Equipment,
  type Goal,
} from "@/lib/store/user-store";
import { generateAndSavePlan } from "@/lib/api/plans";
import { usePlanStore } from "@/lib/store/plan-store";
import { addWeightLog } from "@/lib/api/logs";

export function OnboardingWizard() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const completeOnboarding = useUserStore((s) => s.completeOnboarding);
  const setPlan = usePlanStore((s) => s.setPlan);

  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [bodyInfo, setBodyInfo] = useState<BodyInfo | null>(null);
  const [equipment, setEquipment] = useState<Equipment | null>(null);

  const handleBodyNext = (data: BodyInfo) => {
    setBodyInfo(data);
    setStep(2);
  };

  const handleEquipmentNext = (data: Equipment) => {
    setEquipment(data);
    setStep(3);
  };

  const handleGoalNext = async (goal: Goal) => {
    if (!bodyInfo || !equipment || !user?.id) {
      toast.error("اطلاعات کاربر ناقص است. دوباره وارد شو.");
      return;
    }

    setIsGenerating(true);

    try {
      const { plan } = await generateAndSavePlan({
        userId: user.id,
        bodyInfo,
        equipment,
        goal,
        targetWeight:
          goal === "lose_weight" && bodyInfo.weight > 0
            ? Math.round(bodyInfo.weight * 0.92)
            : undefined,
      });

      // state محلی
      completeOnboarding({
        bodyInfo,
        equipment,
        goal,
        currentPlanId: plan.id,
        targetWeight:
          goal === "lose_weight" && bodyInfo.weight > 0
            ? Math.round(bodyInfo.weight * 0.92)
            : undefined,
      });

      // برای استفاده فوری در داشبورد
      setPlan(plan);

      toast.success("برنامه شخصی‌ات آماده شد!");
      if (bodyInfo?.weight) {
        try {
          await addWeightLog({
            userId: user.id,
            weight: bodyInfo.weight,
            date: plan.startDate, // همان تابع local date
            note: "وزن شروع برنامه",
          });
        } catch (e) {
          console.error("seed weight log failed", e);
        }
      }
      router.push("/dashboard");
    } catch (err) {
      console.error(err);

      // Fallback اگر json-server بالا نباشد
      const fallbackPlanId = `local_plan_${user.id}_${Date.now()}`;
      completeOnboarding({
        bodyInfo,
        equipment,
        goal,
        currentPlanId: fallbackPlanId,
      });

      toast.message("برنامه به‌صورت محلی ذخیره شد", {
        description:
          "json-server در دسترس نبود. با npm run api سرور را بالا بیاور.",
      });
      router.push("/dashboard");
    }
  };

  if (isGenerating) {
    return <GeneratingState />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ProgressHeader currentStep={step} />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.25 }}
              >
                <BodyStep
                  defaultValues={bodyInfo ?? undefined}
                  onNext={handleBodyNext}
                />
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.25 }}
              >
                <EquipmentStep
                  defaultValue={equipment ?? undefined}
                  onNext={handleEquipmentNext}
                  onBack={() => setStep(1)}
                />
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.25 }}
              >
                <GoalStep onNext={handleGoalNext} onBack={() => setStep(2)} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
