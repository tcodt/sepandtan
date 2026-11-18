"use client";

import { useCallback, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { BackendRole, BackendUserStatus } from "@/lib/types/api";
import type { CreateAdminUserPayload } from "@/features/admin/users/types";
import { useCreateAdminUser } from "@/features/admin/users/hooks/use-admin-users";

/* -------------------------------------------------------------------------- */
/* Schema                                                                     */
/* -------------------------------------------------------------------------- */

const createUserSchema = z
  .object({
    name: z.string().min(2, "نام حداقل ۲ کاراکتر"),
    email: z.string().email("ایمیل نامعتبر").or(z.literal("")),
    phone: z.string().optional(),
    password: z.string().min(6, "رمز حداقل ۶ کاراکتر"),
    role: z.enum(["USER", "ADMIN", "SUPERADMIN", "AUTHOR", "COACH", "STORE"]),
    status: z.enum(["ACTIVE", "SUSPENDED", "DELETED"]),
  })
  .refine((v) => !!(v.email?.trim() || v.phone?.trim()), {
    message: "حداقل ایمیل یا موبایل لازم است",
    path: ["email"],
  });

type CreateUserValues = z.infer<typeof createUserSchema>;

const EMPTY_VALUES: CreateUserValues = {
  name: "",
  email: "",
  phone: "",
  password: "",
  role: "USER",
  status: "ACTIVE",
};

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export function CreateUserSheet({
  open,
  onOpenChange,
  onCreated,
  isDesktop,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after a successful create (sheet already closed, list invalidated). */
  onCreated?: () => void;
  isDesktop: boolean;
}) {
  const createMutation = useCreateAdminUser();

  const form = useForm<CreateUserValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: EMPTY_VALUES,
  });

  const roleValue = useWatch({ control: form.control, name: "role" });
  const statusValue = useWatch({ control: form.control, name: "status" });
  const isDirty = form.formState.isDirty;

  // Reset to blank whenever the sheet opens.
  useEffect(() => {
    if (open) form.reset(EMPTY_VALUES);
  }, [open, form]);

  const requestClose = useCallback(
    (nextOpen: boolean) => {
      if (nextOpen) return;
      if (isDirty && !createMutation.isPending) {
        const ok = window.confirm("فرم ساخت کاربر ناقص است. بستن بدون ذخیره؟");
        if (!ok) return;
      }
      onOpenChange(false);
    },
    [isDirty, createMutation.isPending, onOpenChange],
  );

  const handleSubmit = form.handleSubmit((values) => {
    const payload: CreateAdminUserPayload = {
      name: values.name.trim(),
      email: values.email.trim() || undefined,
      phone: values.phone?.trim() || undefined,
      password: values.password,
      role: values.role,
      status: values.status,
    };

    createMutation.mutate(payload, {
      onSuccess: () => {
        // The hook already toasts + invalidates adminUsersKeys.all.
        onOpenChange(false);
        onCreated?.();
      },
    });
  });

  return (
    <Sheet open={open} onOpenChange={requestClose}>
      <SheetContent
        side={isDesktop ? "right" : "bottom"}
        className={cn(
          "flex flex-col overflow-y-auto p-4 md:p-8",
          "h-[75vh] rounded-t-3xl",
          "md:h-full md:w-120 md:max-w-full md:rounded-none md:rounded-l-3xl",
        )}
        dir="rtl"
        aria-describedby={undefined}
      >
        <SheetHeader>
          <SheetTitle>ساخت کاربر</SheetTitle>
          <SheetDescription>
            اطلاعات کاربر جدید را وارد کنید. حداقل ایمیل یا موبایل لازم است.
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={handleSubmit}
          className="mt-6 flex-1 space-y-4 px-1 pb-2"
        >
          <div className="space-y-2">
            <Label htmlFor="create-name">نام</Label>
            <Input id="create-name" autoFocus {...form.register("name")} />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive" role="alert">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="create-email">ایمیل</Label>
            <Input
              id="create-email"
              type="email"
              dir="ltr"
              className="font-mono text-sm"
              {...form.register("email")}
            />
            {form.formState.errors.email && (
              <p className="text-xs text-destructive" role="alert">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="create-phone">موبایل</Label>
            <Input
              id="create-phone"
              dir="ltr"
              className="font-mono text-sm"
              {...form.register("phone")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="create-password">رمز عبور</Label>
            <Input
              id="create-password"
              type="password"
              dir="ltr"
              autoComplete="new-password"
              placeholder="حداقل ۶ کاراکتر"
              {...form.register("password")}
            />
            {form.formState.errors.password && (
              <p className="text-xs text-destructive" role="alert">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>نقش</Label>
            <Select
              value={roleValue ?? "USER"}
              onValueChange={(v) =>
                form.setValue("role", v as BackendRole, {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }
            >
              <SelectTrigger dir="rtl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent dir="rtl">
                <SelectItem value="USER">کاربر</SelectItem>
                <SelectItem value="COACH">مربی</SelectItem>
                <SelectItem value="STORE">فروشنده</SelectItem>
                <SelectItem value="AUTHOR">نویسنده</SelectItem>
                <SelectItem value="ADMIN">ادمین</SelectItem>
                <SelectItem value="SUPERADMIN">سوپرادمین</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>وضعیت</Label>
            <Select
              value={statusValue ?? "ACTIVE"}
              onValueChange={(v) =>
                form.setValue("status", v as BackendUserStatus, {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }
            >
              <SelectTrigger dir="rtl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent dir="rtl">
                <SelectItem value="ACTIVE">فعال</SelectItem>
                <SelectItem value="SUSPENDED">معلق</SelectItem>
                <SelectItem value="DELETED">حذف منطقی</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <SheetFooter className="flex-col-reverse gap-2 pt-4 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => requestClose(false)}
              className="w-full sm:w-auto"
              disabled={createMutation.isPending}
            >
              انصراف
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="w-full sm:w-auto"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  در حال ساخت…
                </>
              ) : (
                "ساخت کاربر"
              )}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
