"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import {
  ArrowRight,
  User,
  Shield,
  Info,
  Settings,
  Moon,
  Sun,
  Monitor,
  ChevronLeft,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { SettingsSection } from "./settings-section";
import { SettingsRow } from "./settings-row";
import { useSettingsStore } from "@/lib/store/settings-store";
import { useUserStore } from "@/lib/store/user-store";
import { cn } from "@/lib/utils";
import { LogoutDialog } from "../common/logout-dialog";

export function SettingsScreen() {
  const { theme, setTheme } = useTheme();
  const user = useUserStore((s) => s.user);

  const {
    notificationsEnabled,
    workoutReminders,
    mealReminders,
    weeklyReport,
    weightUnit,
    heightUnit,
    language,
    reduceMotion,
    setNotificationsEnabled,
    setWorkoutReminders,
    setMealReminders,
    setWeeklyReport,
    setWeightUnit,
    setHeightUnit,
    setLanguage,
    setReduceMotion,
  } = useSettingsStore();

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-8">
      <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <Button variant="ghost" size="sm" asChild className="gap-1.5 -ml-2">
            <Link href="/dashboard">
              <ArrowRight className="w-4 h-4" />
              <span className="hidden sm:inline">داشبورد</span>
            </Link>
          </Button>

          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground flex items-center gap-2">
            <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            <span>تنظیمات</span>
          </h1>

          <div className="w-14 sm:w-20" />
        </div>

        {/* حساب کاربری */}
        <SettingsSection title="حساب کاربری" description="اطلاعات شخصی و حساب">
          <SettingsRow
            label={user?.name ?? "کاربر مهمان"}
            description={user?.email ?? user?.phone ?? "وارد حساب خود شوید"}
          >
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <Link href="/account">
                <User className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">پروفایل</span>
              </Link>
            </Button>
          </SettingsRow>
        </SettingsSection>

        {/* ظاهر */}
        <SettingsSection title="ظاهر" description="تم و نمایش">
          <SettingsRow label="حالت نمایش">
            <div className="flex rounded-lg border border-border overflow-hidden">
              {[
                { value: "light", label: "روشن", icon: Sun },
                { value: "dark", label: "تاریک", icon: Moon },
                { value: "system", label: "سیستم", icon: Monitor },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = theme === item.value;
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setTheme(item.value)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 text-xs transition-all",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-background text-muted-foreground hover:text-foreground hover:bg-muted/50",
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </SettingsRow>

          <SettingsRow
            label="کاهش انیمیشن"
            description="برای تمرکز بیشتر و صرفه‌جویی باتری"
          >
            <Switch checked={reduceMotion} onCheckedChange={setReduceMotion} />
          </SettingsRow>
        </SettingsSection>

        {/* اعلان‌ها */}
        <SettingsSection title="اعلان‌ها" description="یادآوری‌های اپ">
          <SettingsRow label="فعال‌سازی اعلان‌ها">
            <Switch
              checked={notificationsEnabled}
              onCheckedChange={(v) => {
                setNotificationsEnabled(v);
                toast.success(v ? "اعلان‌ها فعال شد" : "اعلان‌ها خاموش شد");
              }}
            />
          </SettingsRow>

          <SettingsRow
            label="یادآوری تمرین"
            description="قبل از زمان تمرین امروز"
          >
            <Switch
              checked={workoutReminders}
              onCheckedChange={setWorkoutReminders}
              disabled={!notificationsEnabled}
            />
          </SettingsRow>

          <SettingsRow
            label="یادآوری وعده غذایی"
            description="برای ثبت وعده‌های غذایی"
          >
            <Switch
              checked={mealReminders}
              onCheckedChange={setMealReminders}
              disabled={!notificationsEnabled}
            />
          </SettingsRow>

          <SettingsRow label="گزارش هفتگی">
            <Switch
              checked={weeklyReport}
              onCheckedChange={setWeeklyReport}
              disabled={!notificationsEnabled}
            />
          </SettingsRow>
        </SettingsSection>

        {/* واحدها */}
        <SettingsSection title="واحدها" description="واحدهای اندازه‌گیری">
          <SettingsRow label="واحد وزن">
            <div className="flex rounded-lg border border-border overflow-hidden">
              {["kg", "lb"].map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setWeightUnit(u as "kg" | "lb")}
                  className={cn(
                    "px-3 py-1.5 text-xs uppercase transition-colors",
                    weightUnit === u
                      ? "bg-primary text-primary-foreground"
                      : "bg-background text-muted-foreground hover:text-foreground hover:bg-muted/50",
                  )}
                >
                  {u}
                </button>
              ))}
            </div>
          </SettingsRow>

          <SettingsRow label="واحد قد">
            <div className="flex rounded-lg border border-border overflow-hidden">
              {["cm", "ft"].map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setHeightUnit(u as "cm" | "ft")}
                  className={cn(
                    "px-3 py-1.5 text-xs uppercase transition-colors",
                    heightUnit === u
                      ? "bg-primary text-primary-foreground"
                      : "bg-background text-muted-foreground hover:text-foreground hover:bg-muted/50",
                  )}
                >
                  {u}
                </button>
              ))}
            </div>
          </SettingsRow>
        </SettingsSection>

        {/* زبان */}
        <SettingsSection title="زبان" description="زبان برنامه">
          <SettingsRow label="زبان اپ">
            <div className="flex rounded-lg border border-border overflow-hidden">
              {[
                { value: "fa", label: "فارسی" },
                { value: "en", label: "English" },
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => {
                    setLanguage(item.value as "fa" | "en");
                    toast.success(
                      item.value === "fa"
                        ? "زبان روی فارسی تنظیم شد"
                        : "Language set to English",
                    );
                  }}
                  className={cn(
                    "px-3 py-1.5 text-xs transition-colors",
                    language === item.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-background text-muted-foreground hover:text-foreground hover:bg-muted/50",
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </SettingsRow>
        </SettingsSection>

        {/* بیشتر */}
        <SettingsSection title="بیشتر" description="لینک‌های مفید">
          <Link
            href="/about"
            className="flex items-center justify-between px-4 py-3.5 hover:bg-muted/40 transition-colors rounded-lg group"
          >
            <span className="text-sm text-foreground flex items-center gap-2">
              <Info className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              درباره سپندتن
            </span>
            <ChevronLeft className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all" />
          </Link>

          <Link
            href="/contact"
            className="flex items-center justify-between px-4 py-3.5 hover:bg-muted/40 transition-colors rounded-lg group"
          >
            <span className="text-sm text-foreground flex items-center gap-2">
              <Shield className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              پشتیبانی و تماس
            </span>
            <ChevronLeft className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all" />
          </Link>
        </SettingsSection>

        {/* خروج */}
        <LogoutDialog
          triggerClassName="w-full h-11 sm:h-12 gap-2 bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg shadow-destructive/20 text-sm sm:text-base font-semibold"
          triggerLabel="خروج از حساب"
        />

        {/* Version */}
        <div className="text-center pt-2">
          <p className="text-[11px] sm:text-xs text-muted-foreground flex items-center justify-center gap-1.5">
            <Sparkles className="w-3 h-3 text-primary" />
            سپندتن · نسخه ۱.۰.۰
          </p>
        </div>
      </div>
    </div>
  );
}
