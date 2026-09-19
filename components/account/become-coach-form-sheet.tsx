"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, CheckCircle2 } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/lib/store/user-store";
import { Textarea } from "../ui/textarea";
import { submitCoachRequest } from "@/lib/api/coach-requests";
import { useRouter } from "next/navigation";
import { useMediaQuery } from "@/hooks/use-media-query";

const SPECIALTIES = [
  "کاهش وزن",
  "افزایش حجم",
  "تناسب اندام",
  "قدرتی",
  "هوازی / استقامتی",
  "تغذیه ورزشی",
  "بازتوانی / آسیب",
  "بدنسازی بانوان",
  "آمادگی جسمانی عمومی",
] as const;

const formSchema = z.object({
  specialties: z.array(z.string()).min(1, "حداقل یک تخصص انتخاب کن"),
  experienceYears: z
    .number({ invalid_type_error: "عدد وارد کن" })
    .min(0, "نمی‌تونه منفی باشه")
    .max(30, "حداکثر ۳۰ سال"),
  bio: z
    .string()
    .min(20, "حداقل ۲۰ کاراکتر بنویس")
    .max(150, "حداکثر ۱۵۰ کاراکتر"),
  instagram: z.string().optional(),
  website: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

export function BecomeCoachFormSheet({ open, onOpenChange, onSuccess }: Props) {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const setUser = useUserStore((s) => s.setUser);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const isDesktop = useMediaQuery("(min-width: 768px)"); // md breakpoint

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      specialties: [],
      experienceYears: 0,
      bio: "",
      instagram: "",
      website: "",
    },
  });

  const toggleSpecialty = (item: string) => {
    const next = selectedSpecialties.includes(item)
      ? selectedSpecialties.filter((s) => s !== item)
      : [...selectedSpecialties, item];

    setSelectedSpecialties(next);
    setValue("specialties", next, { shouldValidate: true });
  };

  const onSubmit = async (data: FormValues) => {
    if (!user?.id) {
      toast.error("ابتدا وارد حسابت شو");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitCoachRequest({
        userId: user.id,
        specialties: data.specialties,
        experienceYears: data.experienceYears,
        bio: data.bio,
        instagram: data.instagram || null,
        website: data.website || null,
      });

      // approve user to coach without admin permission for now
      setUser({
        ...user,
        role: "coach",
      });

      toast.success("درخواستت ثبت شد", {
        description: "بعد از بررسی، پنل مربی برات فعال می‌شه.",
      });

      reset();
      setSelectedSpecialties([]);
      onOpenChange(false);
      onSuccess?.();

      // ریدایرکت به پنل مربی
      setTimeout(() => {
        router.replace("/coach");
      }, 600);
    } catch (err) {
      const message = err instanceof Error ? err.message : "خطا در ثبت درخواست";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isDesktop ? "right" : "bottom"}
        className={cn(
          "rounded-t-3xl overflow-y-auto p-4 md:p-8",
          // Mobile: bottom sheet look
          "h-[70vh] rounded-t-3xl",
          // Desktop: right-side panel look
          "md:h-full md:w-120 md:max-w-full md:rounded-none md:rounded-l-3xl",
        )}
      >
        <SheetHeader className="text-right space-y-1.5 pb-2">
          <SheetTitle className="text-xl font-bold">اطلاعات مربیگری</SheetTitle>
          <SheetDescription className="text-sm text-muted-foreground">
            این اطلاعات در پروفایل مربی‌ات نمایش داده می‌شه.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 py-4">
          {/* تخصص‌ها */}
          <div className="space-y-2">
            <Label>تخصص‌ها (حداقل یک مورد)</Label>
            <div className="flex flex-wrap gap-2">
              {SPECIALTIES.map((item) => {
                const active = selectedSpecialties.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleSpecialty(item)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                      active
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted/50 text-muted-foreground border-border hover:border-primary/40",
                    )}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
            {errors.specialties && (
              <p className="text-xs text-destructive">
                {errors.specialties.message}
              </p>
            )}
          </div>

          {/* سابقه */}
          <div className="space-y-2">
            <Label htmlFor="experienceYears">سابقه مربیگری (سال)</Label>
            <Input
              id="experienceYears"
              type="number"
              min={0}
              max={30}
              className="h-11"
              {...register("experienceYears", { valueAsNumber: true })}
            />
            {errors.experienceYears && (
              <p className="text-xs text-destructive">
                {errors.experienceYears.message}
              </p>
            )}
          </div>

          {/* بیو */}
          <div className="space-y-2">
            <Label htmlFor="bio">بیو کوتاه (حداکثر ۱۵۰ کاراکتر)</Label>
            <Textarea
              id="bio"
              rows={3}
              placeholder="مثلاً: مربی کاهش وزن و تناسب اندام با ۵ سال سابقه..."
              className="resize-none"
              {...register("bio")}
            />
            {errors.bio && (
              <p className="text-xs text-destructive">{errors.bio.message}</p>
            )}
          </div>

          {/* اینستاگرام */}
          <div className="space-y-2">
            <Label htmlFor="instagram">اینستاگرام (اختیاری)</Label>
            <Input
              id="instagram"
              placeholder="@username"
              className="h-11"
              dir="ltr"
              {...register("instagram")}
            />
          </div>

          {/* سایت */}
          <div className="space-y-2">
            <Label htmlFor="website">سایت یا لینک دیگر (اختیاری)</Label>
            <Input
              id="website"
              placeholder="https://"
              className="h-11"
              dir="ltr"
              {...register("website")}
            />
          </div>

          <SheetFooter className="flex flex-col gap-2 pt-2">
            <Button
              type="submit"
              className="w-full h-11 font-semibold"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  در حال ثبت...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  ثبت درخواست مربیگری
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              انصراف
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
