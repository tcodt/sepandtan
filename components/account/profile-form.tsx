"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
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
import { cn } from "@/lib/utils";

const profileSchema = z.object({
  name: z.string().min(2, "نام باید حداقل ۲ کاراکتر باشد"),
  gender: z.enum(["male", "female"]),
  age: z.coerce.number().min(14, "حداقل ۱۴").max(80, "حداکثر ۸۰"),
  height: z.coerce.number().min(120, "حداقل ۱۲۰").max(230, "حداکثر ۲۳۰"),
  weight: z.coerce.number().min(30, "حداقل ۳۰").max(250, "حداکثر ۲۵۰"),
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

type ProfileFormValues = z.infer<typeof profileSchema>;

const activityOptions = [
  {
    value: "sedentary",
    label: "کم‌تحرک",
    icon: Clock,
    description: "نشسته و بدون فعالیت",
  },
  {
    value: "light",
    label: "سبک",
    icon: Footprints,
    description: "پیاده‌روی روزانه",
  },
  {
    value: "moderate",
    label: "متوسط",
    icon: Heart,
    description: "ورزش ۳-۲ بار در هفته",
  },
  {
    value: "active",
    label: "فعال",
    icon: Flame,
    description: "ورزش ۵-۴ بار در هفته",
  },
  {
    value: "very_active",
    label: "بسیار فعال",
    icon: Zap,
    description: "ورزش روزانه",
  },
] as const;

const equipmentOptions = [
  { value: "home", label: "خانه", icon: Home, description: "بدون تجهیزات" },
  {
    value: "gym",
    label: "باشگاه",
    icon: Building2,
    description: "تجهیزات کامل",
  },
  { value: "both", label: "هر دو", icon: RefreshCw, description: "ترکیبی" },
] as const;

const goalOptions = [
  {
    value: "lose_weight",
    label: "کاهش وزن",
    icon: Weight,
    description: "کاهش چربی و وزن",
  },
  {
    value: "build_muscle",
    label: "افزایش عضله",
    icon: Dumbbell,
    description: "حجم و قدرت",
  },
  {
    value: "maintain",
    label: "حفظ تناسب",
    icon: Brain,
    description: "تناسب اندام پایدار",
  },
  {
    value: "endurance",
    label: "استقامت",
    icon: Heart,
    description: "افزایش استقامت",
  },
  {
    value: "general_fitness",
    label: "آمادگی عمومی",
    icon: Activity,
    description: "سلامت عمومی",
  },
] as const;

export function ProfileForm() {
  const user = useUserStore((s) => s.user);
  const updateProfile = useUserStore((s) => s.updateProfile);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
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

  const onSubmit = (data: ProfileFormValues) => {
    const bodyInfo: BodyInfo = {
      gender: data.gender,
      age: data.age,
      height: data.height,
      weight: data.weight,
      activityLevel: data.activityLevel,
    };

    updateProfile({
      name: data.name,
      bodyInfo,
      equipment: data.equipment as Equipment,
      goal: data.goal as Goal,
    });

    toast.success("پروفایل با موفقیت ذخیره شد");
  };

  // eslint-disable-next-line react-hooks/incompatible-library
  const selectedGender = form.watch("gender");
  const selectedActivityLevel = form.watch("activityLevel");
  const selectedEquipment = form.watch("equipment");
  const selectedGoal = form.watch("goal");

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-5 sm:space-y-6"
    >
      {/* نام */}
      <div className="space-y-2">
        <Label
          htmlFor="name"
          className="text-sm font-medium flex items-center gap-2"
        >
          <User className="w-4 h-4 text-muted-foreground" />
          نام و نام خانوادگی
        </Label>
        <Input
          id="name"
          className="h-11 bg-background"
          {...form.register("name")}
          placeholder="نام خود را وارد کنید"
        />
        {form.formState.errors.name && (
          <p className="text-sm text-destructive">
            {form.formState.errors.name.message}
          </p>
        )}
      </div>

      {/* تماس (فقط نمایش) */}
      <div className="space-y-2">
        <Label>اطلاعات تماس</Label>
        <Input
          className="h-11 bg-muted/50 cursor-not-allowed"
          value={user?.email || user?.phone || ""}
          disabled
          dir={user?.email ? "ltr" : "rtl"}
        />
        <p className="text-[11px] text-muted-foreground">
          برای تغییر ایمیل یا موبایل با پشتیبانی تماس بگیرید
        </p>
      </div>

      {/* جنسیت */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <User className="w-4 h-4 text-muted-foreground" />
          جنسیت
        </Label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: "male", label: "مرد" },
            { value: "female", label: "زن" },
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() =>
                form.setValue("gender", item.value as "male" | "female", {
                  shouldValidate: true,
                })
              }
              className={cn(
                "h-11 rounded-xl border text-sm font-medium transition-all",
                selectedGender === item.value
                  ? "border-primary bg-primary/10 text-primary shadow-sm shadow-primary/10"
                  : "border-border bg-background hover:bg-muted hover:border-primary/30",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* سن / قد / وزن */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Ruler className="w-4 h-4 text-muted-foreground" />
          اطلاعات بدنی
        </Label>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="space-y-1.5">
            <Label
              htmlFor="age"
              className="text-xs text-muted-foreground flex items-center gap-1"
            >
              <Calendar className="w-3 h-3" />
              سن
            </Label>
            <Input
              id="age"
              type="number"
              className="h-11 bg-background"
              {...form.register("age")}
            />
            {form.formState.errors.age && (
              <p className="text-xs text-destructive">
                {form.formState.errors.age.message}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label
              htmlFor="height"
              className="text-xs text-muted-foreground flex items-center gap-1"
            >
              <Ruler className="w-3 h-3" />
              قد (cm)
            </Label>
            <Input
              id="height"
              type="number"
              className="h-11 bg-background"
              {...form.register("height")}
            />
            {form.formState.errors.height && (
              <p className="text-xs text-destructive">
                {form.formState.errors.height.message}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label
              htmlFor="weight"
              className="text-xs text-muted-foreground flex items-center gap-1"
            >
              <Weight className="w-3 h-3" />
              وزن (kg)
            </Label>
            <Input
              id="weight"
              type="number"
              className="h-11 bg-background"
              {...form.register("weight")}
            />
            {form.formState.errors.weight && (
              <p className="text-xs text-destructive">
                {form.formState.errors.weight.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* سطح فعالیت */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-muted-foreground" />
          سطح فعالیت
        </Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {activityOptions.map((item) => {
            const Icon = item.icon;
            const isSelected = selectedActivityLevel === item.value;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() =>
                  form.setValue("activityLevel", item.value, {
                    shouldValidate: true,
                  })
                }
                className={cn(
                  "rounded-xl border p-3 text-right transition-all",
                  isSelected
                    ? "border-primary bg-primary/10 text-primary shadow-sm shadow-primary/10"
                    : "border-border bg-background hover:bg-muted hover:border-primary/30",
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                      isSelected
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-sm font-medium",
                        isSelected ? "text-primary" : "text-foreground",
                      )}
                    >
                      {item.label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* امکانات */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Dumbbell className="w-4 h-4 text-muted-foreground" />
          امکانات تمرینی
        </Label>
        <div className="grid grid-cols-3 gap-2">
          {equipmentOptions.map((item) => {
            const Icon = item.icon;
            const isSelected = selectedEquipment === item.value;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() =>
                  form.setValue("equipment", item.value, {
                    shouldValidate: true,
                  })
                }
                className={cn(
                  "rounded-xl border p-3 text-center transition-all",
                  isSelected
                    ? "border-primary bg-primary/10 text-primary shadow-sm shadow-primary/10"
                    : "border-border bg-background hover:bg-muted hover:border-primary/30",
                )}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-1.5",
                    isSelected
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <p
                  className={cn(
                    "text-xs font-medium",
                    isSelected ? "text-primary" : "text-foreground",
                  )}
                >
                  {item.label}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {item.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* هدف */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Target className="w-4 h-4 text-muted-foreground" />
          هدف اصلی
        </Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {goalOptions.map((item) => {
            const Icon = item.icon;
            const isSelected = selectedGoal === item.value;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() =>
                  form.setValue("goal", item.value, { shouldValidate: true })
                }
                className={cn(
                  "rounded-xl border p-3 text-right transition-all",
                  isSelected
                    ? "border-primary bg-primary/10 text-primary shadow-sm shadow-primary/10"
                    : "border-border bg-background hover:bg-muted hover:border-primary/30",
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                      isSelected
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-sm font-medium",
                        isSelected ? "text-primary" : "text-foreground",
                      )}
                    >
                      {item.label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <Button
        type="submit"
        className="w-full h-11 sm:h-12 gap-2 text-base font-semibold shadow-lg shadow-primary/20"
        disabled={form.formState.isSubmitting}
      >
        {form.formState.isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            در حال ذخیره...
          </>
        ) : (
          <>
            <Save className="w-4 h-4" />
            ذخیره تغییرات
          </>
        )}
      </Button>
    </form>
  );
}
