"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

import { GeneratingState } from "./generating-state";
import { BodyStep } from "./steps/body-step";
import { EquipmentStep } from "./steps/equipment-step";
import { GoalStep } from "./steps/goal-step";
import {
  useUserStore,
  type BodyInfo,
  type Equipment,
  type Goal,
} from "@/lib/store/user-store";
import { ProgressHeader } from "./progress-header";

export function OnboardingWizard() {
  const router = useRouter();
  const completeOnboarding = useUserStore((s) => s.completeOnboarding);

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
    if (!bodyInfo || !equipment) return;

    setIsGenerating(true);

    // ==================== MOCK ====================
    // وقتی بک‌اند آماده شد این بخش را جایگزین کن:
    // await fetch("/api/plans/generate", {
    //   method: "POST",
    //   body: JSON.stringify({ bodyInfo, equipment, goal }),
    // });
    // ==============================================

    await new Promise((resolve) => setTimeout(resolve, 2200));

    completeOnboarding({
      bodyInfo,
      equipment,
      goal,
    });

    toast.success("برنامه شخصی‌ات آماده شد!");
    router.push("/dashboard");
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
