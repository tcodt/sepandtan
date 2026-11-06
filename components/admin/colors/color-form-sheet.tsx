"use client";

import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import type {
  ColorAdmin,
  CreateColorInput,
  UpdateColorInput,
} from "@/features/catalog/types";
import { toSlug } from "@/features/catalog/utils";
import { useMediaQuery } from "@/hooks/use-media-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

import { ColorPicker } from "./color-picker";
import { PresetSwatches } from "./preset-swatches";
import { HEX_RE, normalizeHex } from "./color-math";

/* -------------------------------------------------------------------------- */
/* Schema                                                                     */
/* -------------------------------------------------------------------------- */

const colorSchema = z.object({
  name: z.string().min(2, "نام حداقل ۲ کاراکتر"),
  slug: z
    .string()
    .min(2, "اسلاگ لازم است")
    .regex(/^[a-z0-9-]+$/, "فقط حروف لاتین، عدد و -"),
  hexCode: z
    .string()
    .min(4, "کد رنگ لازم است")
    .regex(HEX_RE, "فرمت معتبر: #RGB یا #RRGGBB"),
});

type ColorFormValues = z.infer<typeof colorSchema>;

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export function ColorFormSheet({
  open,
  onOpenChange,
  editing,
  onCreate,
  onUpdate,
  isPending,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: ColorAdmin | null;
  onCreate: (payload: CreateColorInput) => void;
  onUpdate: (id: string, payload: UpdateColorInput) => void;
  isPending: boolean;
}) {
  const isMobile = useMediaQuery("(max-width: 767px)");

  const form = useForm<ColorFormValues>({
    resolver: zodResolver(colorSchema),
    defaultValues: { name: "", slug: "", hexCode: "#1587eb" },
  });

  const {
    formState: { errors },
  } = form;

  const [slugTouched, setSlugTouched] = useState(false);
  const name = useWatch({ control: form.control, name: "name" });
  const hexCode = useWatch({ control: form.control, name: "hexCode" });

  useEffect(() => {
    if (!open) return;
    if (editing) {
      form.reset({
        name: editing.name,
        slug: editing.slug,
        hexCode: editing.hexCode,
      });
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSlugTouched(true);
    } else {
      form.reset({ name: "", slug: "", hexCode: "#1587eb" });
      setSlugTouched(false);
    }
  }, [editing, open, form]);

  useEffect(() => {
    if (slugTouched || editing) return;
    if (!name?.trim()) return;
    form.setValue("slug", toSlug(name), { shouldValidate: true });
  }, [name, slugTouched, editing, form]);

  const handleSubmit = form.handleSubmit((values) => {
    const hex = normalizeHex(values.hexCode);
    if (editing) {
      onUpdate(editing.id, {
        slug: values.slug.trim(),
        name: values.name.trim(),
        hexCode: hex,
      });
    } else {
      onCreate({
        name: values.name.trim(),
        slug: values.slug.trim(),
        hexCode: hex,
      });
    }
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        dir="rtl"
        className={cn(
          "flex flex-col overflow-hidden p-3",
          isMobile
            ? "h-[85vh] max-h-[85vh] w-full rounded-t-2xl"
            : "w-full sm:max-w-md",
        )}
      >
        {isMobile && (
          <div
            className="mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-full bg-muted-foreground/30"
            aria-hidden="true"
          />
        )}

        <SheetHeader className={cn(isMobile ? "px-4 pt-3" : "p-6 pb-2")}>
          <SheetTitle>{editing ? "ویرایش رنگ" : "رنگ جدید"}</SheetTitle>
          <SheetDescription>
            {editing
              ? "اطلاعات رنگ را ویرایش کنید. تغییرات پس از ذخیره اعمال می‌شود."
              : "برای ساخت یک رنگ جدید، اطلاعات زیر را تکمیل کنید."}
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={handleSubmit}
          className={cn(
            "flex min-h-0 flex-1 flex-col",
            isMobile ? "px-4" : "px-6",
          )}
        >
          <div
            className={cn(
              "min-h-0 flex-1 space-y-4 overflow-y-auto pb-4",
              "[scrollbar-width:thin] [scrollbar-color:transparent_transparent]",
              "hover:[scrollbar-color:rgba(148,163,184,0.35)_transparent]",
              "[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar]:bg-transparent",
              "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-transparent",
              "hover:[&::-webkit-scrollbar-thumb]:bg-zinc-400/30",
            )}
          >
            <div className="space-y-2">
              <Label htmlFor="color-name">نام</Label>
              <Input id="color-name" {...form.register("name")} />
              {errors.name && (
                <p className="text-xs text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="color-slug">اسلاگ (انگلیسی)</Label>
              <Input
                id="color-slug"
                dir="ltr"
                className="font-mono text-sm"
                {...form.register("slug")}
                onChange={(e) => {
                  setSlugTouched(true);
                  form.setValue("slug", e.target.value, {
                    shouldValidate: true,
                  });
                }}
              />
              {errors.slug && (
                <p className="text-xs text-destructive">
                  {errors.slug.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>رنگ</Label>
              <ColorPicker
                value={hexCode ?? "#000000"}
                onChange={(next) =>
                  form.setValue("hexCode", next, { shouldValidate: true })
                }
                disabled={isPending}
              />
              {errors.hexCode && (
                <p className="text-xs text-destructive">
                  {errors.hexCode.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>رنگ‌های آماده</Label>
              <PresetSwatches
                value={hexCode ?? "#000000"}
                onChange={(next) =>
                  form.setValue("hexCode", next, { shouldValidate: true })
                }
                disabled={isPending}
              />
            </div>
          </div>

          <SheetFooter
            className={cn(
              "flex-col-reverse gap-2 pt-4 sm:flex-row sm:justify-end",
              isMobile &&
                "border-t border-border bg-background/95 px-4 py-3 backdrop-blur",
            )}
          >
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto"
              disabled={isPending}
            >
              انصراف
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="w-full sm:w-auto"
            >
              {isPending ? (
                <>
                  <Loader2 className="me-2 size-4 animate-spin" />
                  در حال ذخیره…
                </>
              ) : editing ? (
                "ذخیره تغییرات"
              ) : (
                "ایجاد رنگ"
              )}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
