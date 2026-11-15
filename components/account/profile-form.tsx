"use client";

import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Loader2,
  Save,
  User,
  Activity,
  Dumbbell,
  Target,
  Clock,
  Ruler,
  Weight,
  Calendar,
  Home,
  Building2,
  RefreshCw,
  Flame,
  Brain,
  Heart,
  Zap,
  Footprints,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useUserStore,
  type BodyInfo,
  type Equipment,
  type Goal,
} from "@/lib/store/user-store";
import { updateMyProfile } from "@/lib/api/auth";
import {
  mapOnboardingToUpdateProfileDto,
  mapProfileResponseToUser,
} from "@/lib/api/mappers/user";
import { getErrorMessage } from "@/lib/api/client";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/* Schemas                                                                    */
/* -------------------------------------------------------------------------- */

const identitySchema = z.object({
  name: z.string().min(2, "نام باید حداقل ۲ کاراکتر باشد"),
});

const traineeSchema = identitySchema.extend({
  gender: z.enum(["male", "female"]),
  age: z
    .number({ message: "سن معتبر نیست" })
    .min(14, "حداقل ۱۴")
    .max(80, "حداکثر ۸۰"),
  height: z
    .number({ message: "قد معتبر نیست" })
    .min(120, "حداقل ۱۲۰")
    .max(230, "حداکثر ۲۳۰"),
  weight: z
    .number({ message: "وزن معتبر نیست" })
    .min(30, "حداقل ۳۰")
    .max(250, "حداکثر ۲۵۰"),
  activityLevel: z.enum([
    "sedentary",
    "light",
    "moderate",
    "active",
    "very_active",
  ]),
  equipment: z.enum(["home", "gym", "both"]),
  goal: z.enum([
    "lose_weight",
    "build_muscle",
    "maintain",
    "endurance",
    "general_fitness",
  ]),
});

type IdentityFormValues = z.infer<typeof identitySchema>;
type TraineeFormValues = z.infer<typeof traineeSchema>;

/* -------------------------------------------------------------------------- */
/* Options                                                                    */
/* -------------------------------------------------------------------------- */

const activityOptions = [
  {
    value: "sedentary" as const,
    label: "کم‌تحرک",
    icon: Clock,
    description: "نشسته و بدون فعالیت",
  },
  {
    value: "light" as const,
    label: "سبک",
    icon: Footprints,
    description: "پیاده‌روی روزانه",
  },
  {
    value: "moderate" as const,
    label: "متوسط",
    icon: Heart,
    description: "ورزش ۳-۲ بار در هفته",
  },
  {
    value: "active" as const,
    label: "فعال",
    icon: Flame,
    description: "ورزش ۵-۴ بار در هفته",
  },
  {
    value: "very_active" as const,
    label: "بسیار فعال",
    icon: Zap,
    description: "ورزش روزانه",
  },
] as const;

const equipmentOptions = [
  {
    value: "home" as const,
    label: "خانه",
    icon: Home,
    description: "بدون تجهیزات",
  },
  {
    value: "gym" as const,
    label: "باشگاه",
    icon: Building2,
    description: "تجهیزات کامل",
  },
  {
    value: "both" as const,
    label: "هر دو",
    icon: RefreshCw,
    description: "ترکیبی",
  },
] as const;

const goalOptions = [
  {
    value: "lose_weight" as const,
    label: "کاهش وزن",
    icon: Weight,
    description: "کاهش چربی و وزن",
  },
  {
    value: "build_muscle" as const,
    label: "افزایش عضله",
    icon: Dumbbell,
    description: "حجم و قدرت",
  },
  {
    value: "maintain" as const,
    label: "حفظ تناسب",
    icon: Brain,
    description: "تناسب اندام پایدار",
  },
  {
    value: "endurance" as const,
    label: "استقامت",
    icon: Heart,
    description: "افزایش استقامت",
  },
  {
    value: "general_fitness" as const,
    label: "آمادگی عمومی",
    icon: Activity,
    description: "سلامت عمومی",
  },
] as const;

/* -------------------------------------------------------------------------- */
/* Shared contact field                                                       */
/* -------------------------------------------------------------------------- */

function ContactReadonly() {
  const user = useUserStore((s) => s.user);
  return (
    <div className="space-y-2">
      <Label>اطلاعات تماس</Label>
      <Input
        className="h-11 cursor-not-allowed bg-muted/50"
        value={user?.email || user?.phone || ""}
        disabled
        dir={user?.email ? "ltr" : "rtl"}
      />
      <p className="text-[11px] text-muted-foreground">
        برای تغییر ایمیل یا موبایل با پشتیبانی تماس بگیرید
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Identity-only (seller / coach / admin)                                     */
/* -------------------------------------------------------------------------- */

function IdentityProfileForm() {
  const user = useUserStore((s) => s.user);
  const updateProfile = useUserStore((s) => s.updateProfile);
  const setAuthFromBackend = useUserStore((s) => s.setAuthFromBackend);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<IdentityFormValues>({
    resolver: zodResolver(identitySchema),
    defaultValues: {
      name: user?.name ?? "",
    },
  });

  // ✅ Destructure errors once — silences follow-up compiler warnings
  const {
    formState: { errors },
  } = form;

  useEffect(() => {
    if (!user) return;
    form.reset({ name: user.name ?? "" });
  }, [user, form]);

  const onSubmit = async (data: IdentityFormValues) => {
    if (!user) return;
    setIsSaving(true);
    try {
      const nameParts = data.name.trim().split(/\s+/);
      const firstName = nameParts[0] ?? data.name;
      const lastName = nameParts.slice(1).join(" ") || undefined;

      const res = await updateMyProfile({ firstName, lastName });
      const mapped = mapProfileResponseToUser(res);
      setAuthFromBackend({
        ...mapped,
        name: data.name.trim(),
      });
      updateProfile({ name: data.name.trim() });
      toast.success("پروفایل در سرور ذخیره شد");
    } catch (err) {
      toast.error(getErrorMessage(err, "ذخیره پروفایل ناموفق بود"));
    } finally {
      setIsSaving(false);
    }
  };

  const busy = isSaving || form.formState.isSubmitting;

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-5 sm:space-y-6"
    >
      <div className="space-y-2">
        <Label
          htmlFor="name"
          className="flex items-center gap-2 text-sm font-medium"
        >
          <User className="h-4 w-4 text-muted-foreground" />
          نام و نام خانوادگی
        </Label>
        <Input
          id="name"
          className="h-11"
          {...form.register("name")}
          placeholder="نام خود را وارد کنید"
          disabled={busy}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <ContactReadonly />

      <Button type="submit" className="w-full gap-2" disabled={busy}>
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Save className="h-4 w-4" />
        )}
        ذخیره تغییرات
      </Button>
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/* Trainee (onboarding fields)                                                */
/* -------------------------------------------------------------------------- */

function TraineeProfileForm() {
  const user = useUserStore((s) => s.user);
  const updateProfile = useUserStore((s) => s.updateProfile);
  const setAuthFromBackend = useUserStore((s) => s.setAuthFromBackend);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<TraineeFormValues>({
    resolver: zodResolver(traineeSchema),
    defaultValues: {
      name: user?.name ?? "",
      gender: user?.bodyInfo?.gender ?? "male",
      age: user?.bodyInfo?.age ?? 25,
      height: user?.bodyInfo?.height ?? 175,
      weight: user?.bodyInfo?.weight ?? 70,
      activityLevel: user?.bodyInfo?.activityLevel ?? "moderate",
      equipment: user?.equipment ?? "home",
      goal: user?.goal ?? "general_fitness",
    },
  });

  // ✅ Destructure errors once
  const {
    formState: { errors },
  } = form;

  // ✅ useWatch replaces all form.watch(...) calls
  const selectedGender = useWatch({ control: form.control, name: "gender" });
  const selectedActivityLevel = useWatch({
    control: form.control,
    name: "activityLevel",
  });
  const selectedEquipment = useWatch({
    control: form.control,
    name: "equipment",
  });
  const selectedGoal = useWatch({ control: form.control, name: "goal" });

  useEffect(() => {
    if (!user) return;
    form.reset({
      name: user.name ?? "",
      gender: user.bodyInfo?.gender ?? "male",
      age: user.bodyInfo?.age ?? 25,
      height: user.bodyInfo?.height ?? 175,
      weight: user.bodyInfo?.weight ?? 70,
      activityLevel: user.bodyInfo?.activityLevel ?? "moderate",
      equipment: user.equipment ?? "home",
      goal: user.goal ?? "general_fitness",
    });
  }, [user, form]);

  const onSubmit = async (data: TraineeFormValues) => {
    if (!user) return;
    setIsSaving(true);

    try {
      const bodyInfo: BodyInfo = {
        gender: data.gender,
        age: data.age,
        height: data.height,
        weight: data.weight,
        activityLevel: data.activityLevel,
      };

      const nameParts = data.name.trim().split(/\s+/);
      const firstName = nameParts[0] ?? data.name;
      const lastName = nameParts.slice(1).join(" ") || undefined;

      const payload = {
        ...mapOnboardingToUpdateProfileDto({
          bodyInfo,
          equipment: data.equipment as Equipment,
          goal: data.goal as Goal,
          targetWeight: user.targetWeight,
        }),
        firstName,
        lastName,
      };

      const res = await updateMyProfile(payload);
      const mapped = mapProfileResponseToUser(res);

      setAuthFromBackend({
        ...mapped,
        name: data.name.trim(),
        goal: data.goal as Goal,
        equipment: data.equipment as Equipment,
      });

      updateProfile({
        name: data.name.trim(),
        bodyInfo,
        equipment: data.equipment as Equipment,
        goal: data.goal as Goal,
      });

      toast.success("پروفایل در سرور ذخیره شد");
    } catch (err) {
      toast.error(getErrorMessage(err, "ذخیره پروفایل ناموفق بود"));
    } finally {
      setIsSaving(false);
    }
  };

  const busy = isSaving || form.formState.isSubmitting;

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-5 sm:space-y-6"
    >
      <div className="space-y-2">
        <Label
          htmlFor="name"
          className="flex items-center gap-2 text-sm font-medium"
        >
          <User className="h-4 w-4 text-muted-foreground" />
          نام و نام خانوادگی
        </Label>
        <Input
          id="name"
          className="h-11"
          {...form.register("name")}
          placeholder="نام خود را وارد کنید"
          disabled={busy}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <ContactReadonly />

      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          جنسیت
        </Label>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              { value: "male" as const, label: "مرد" },
              { value: "female" as const, label: "زن" },
            ] as const
          ).map((item) => (
            <button
              key={item.value}
              type="button"
              disabled={busy}
              onClick={() =>
                form.setValue("gender", item.value, { shouldValidate: true })
              }
              className={cn(
                "h-11 rounded-xl border text-sm font-medium transition-all",
                selectedGender === item.value
                  ? "border-primary bg-primary/10 text-primary shadow-sm shadow-primary/10"
                  : "border-border bg-background hover:border-primary/30 hover:bg-muted",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Ruler className="h-4 w-4 text-muted-foreground" />
          اطلاعات بدنی
        </Label>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="space-y-1.5">
            <Label
              htmlFor="age"
              className="flex items-center gap-1 text-xs text-muted-foreground"
            >
              <Calendar className="h-3 w-3" />
              سن
            </Label>
            <Input
              id="age"
              type="number"
              className="h-11"
              disabled={busy}
              {...form.register("age", { valueAsNumber: true })}
            />
            {errors.age && (
              <p className="text-xs text-destructive">{errors.age.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label
              htmlFor="height"
              className="flex items-center gap-1 text-xs text-muted-foreground"
            >
              <Ruler className="h-3 w-3" />
              قد (cm)
            </Label>
            <Input
              id="height"
              type="number"
              className="h-11"
              disabled={busy}
              {...form.register("height", { valueAsNumber: true })}
            />
            {errors.height && (
              <p className="text-xs text-destructive">
                {errors.height.message}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label
              htmlFor="weight"
              className="flex items-center gap-1 text-xs text-muted-foreground"
            >
              <Weight className="h-3 w-3" />
              وزن (kg)
            </Label>
            <Input
              id="weight"
              type="number"
              className="h-11"
              disabled={busy}
              {...form.register("weight", { valueAsNumber: true })}
            />
            {errors.weight && (
              <p className="text-xs text-destructive">
                {errors.weight.message}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-muted-foreground" />
          سطح فعالیت
        </Label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {activityOptions.map((item) => {
            const Icon = item.icon;
            const isSelected = selectedActivityLevel === item.value;
            return (
              <button
                key={item.value}
                type="button"
                disabled={busy}
                onClick={() =>
                  form.setValue("activityLevel", item.value, {
                    shouldValidate: true,
                  })
                }
                className={cn(
                  "rounded-xl border p-3 text-right transition-all",
                  isSelected
                    ? "border-primary bg-primary/10 text-primary shadow-sm shadow-primary/10"
                    : "border-border bg-background hover:border-primary/30 hover:bg-muted",
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                      isSelected ? "bg-primary/15" : "bg-muted",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Dumbbell className="h-4 w-4 text-muted-foreground" />
          محل تمرین
        </Label>
        <div className="grid grid-cols-3 gap-2">
          {equipmentOptions.map((item) => {
            const Icon = item.icon;
            const isSelected = selectedEquipment === item.value;
            return (
              <button
                key={item.value}
                type="button"
                disabled={busy}
                onClick={() =>
                  form.setValue("equipment", item.value, {
                    shouldValidate: true,
                  })
                }
                className={cn(
                  "rounded-xl border p-3 text-center transition-all",
                  isSelected
                    ? "border-primary bg-primary/10 text-primary shadow-sm"
                    : "border-border bg-background hover:border-primary/30 hover:bg-muted",
                )}
              >
                <Icon className="mx-auto mb-1 h-4 w-4" />
                <p className="text-xs font-medium">{item.label}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Target className="h-4 w-4 text-muted-foreground" />
          هدف
        </Label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {goalOptions.map((item) => {
            const Icon = item.icon;
            const isSelected = selectedGoal === item.value;
            return (
              <button
                key={item.value}
                type="button"
                disabled={busy}
                onClick={() =>
                  form.setValue("goal", item.value, { shouldValidate: true })
                }
                className={cn(
                  "rounded-xl border p-3 text-right transition-all",
                  isSelected
                    ? "border-primary bg-primary/10 text-primary shadow-sm"
                    : "border-border bg-background hover:border-primary/30 hover:bg-muted",
                )}
              >
                <div className="flex items-start gap-3">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <Button type="submit" className="w-full gap-2" disabled={busy}>
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Save className="h-4 w-4" />
        )}
        ذخیره تغییرات
      </Button>
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/* Public                                                                     */
/* -------------------------------------------------------------------------- */

export function ProfileForm() {
  const role = useUserStore((s) => s.user?.role);

  if (role === "trainee") {
    return <TraineeProfileForm />;
  }

  return <IdentityProfileForm />;
}
